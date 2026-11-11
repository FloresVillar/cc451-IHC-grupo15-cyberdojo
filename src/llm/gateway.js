// LLM Gateway: una sola interfaz para la app, varios proveedores detrás (RF03, RF04, RNF08, RNF10).
//   generarEscenario(perfil)        -> escenario nuevo adaptado al rol, dificultad y tácticas débiles
//   evaluarRespuesta({escenario, respuesta}) -> ¿la respuesta hablada/escrita es segura?
//   conversar({pregunta, perfil, escenario}) -> respuesta del sensei (asistente por voz)
// Si el proveedor falla o tarda más de LLM_TIMEOUT_MS, se usa el banco de escenarios o reglas locales.
import { readFileSync } from 'node:fs';
import { PROVEEDORES } from './providers.js';
import { sanitizar, validarEscenario, limpiarTexto } from './guardrails.js';
import '../../app/js/reglas.js';

const leer = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const DATOS = leer('../../data/escenarios.json');
const FAQ = leer('../../data/sensei-faq.json');
export const BANCO = DATOS.escenarios;
export const TACTICAS = DATOS.tacticas;

const SISTEMA = `Eres el sensei de CyberDojo, un entrenamiento de concientización en ciberseguridad para
colaboradores de una empresa peruana ficticia (Inversiones Kallpa S.A.C., dominio kallpa.test).
Hablas en español peruano claro, cercano y sin tecnicismos innecesarios. Nunca culpas al usuario.
Usa SOLO empresas, personas y dominios ficticios con TLD .test. Nunca des instrucciones para atacar,
crear malware ni datos reales.`;

/** Extrae el primer objeto JSON de un texto (los modelos a veces lo envuelven en ```json). */
export function extraerJSON(texto) {
  const limpio = String(texto).replace(/```(?:json)?/gi, '').trim();
  const ini = limpio.indexOf('{'), fin = limpio.lastIndexOf('}');
  if (ini < 0 || fin < ini) throw new Error('respuesta sin JSON');
  return JSON.parse(limpio.slice(ini, fin + 1));
}

const normal = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Evaluación por reglas de una respuesta a una llamada (la misma que usa la PWA sin conexión). */
export const evaluarPorReglas = (escenario, respuesta) => globalThis.REGLAS.evaluarRespuesta(escenario, respuesta);

/** Respuesta del sensei sin LLM: la entrada del FAQ con más coincidencias, más contexto del combate. */
export function senseiPorReglas(pregunta, escenario) {
  const s = normal(pregunta);
  let mejor = null, max = 0;
  for (const f of FAQ.faq) {
    const n = f.claves.filter(k => s.includes(normal(k))).length;
    if (n > max) { max = n; mejor = f; }
  }
  const pideContexto = /(ultimo|ultima|este|ese|por que|porque|combate|escenario)/.test(s);
  if (escenario && (pideContexto || !mejor)) {
    const senales = (escenario.senales || []).slice(0, 3).join('; ');
    return `${escenario.es_ataque ? 'Era un ataque' : 'Era un mensaje legítimo'}. Las señales clave: ${senales}. ${escenario.debrief}`;
  }
  return mejor ? mejor.respuesta : FAQ.por_defecto;
}

function percentil(arr, p) {
  if (!arr.length) return null;
  const o = [...arr].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(p * o.length))];
}

export function crearGateway(env = process.env, { proveedores = PROVEEDORES, banco = BANCO } = {}) {
  const nombre = env.LLM_PROVIDER || 'mock';
  const proveedor = proveedores[nombre];
  if (!proveedor) throw new Error(`Proveedor LLM desconocido: ${nombre}. Opciones: ${Object.keys(proveedores).join(', ')}`);
  // Un LLM remoto tarda de 3 a 20 s en escribir un escenario completo en JSON.
  const timeout = Number(env.LLM_TIMEOUT_MS || 20000);
  const latencias = [];
  let fallos = 0, exitos = 0;

  async function llamar(peticion, ms = timeout) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(new Error('timeout')), ms);
    const t0 = Date.now();
    try {
      const r = await proveedor.completar({ sistema: SISTEMA, ...peticion }, env, ctl.signal);
      latencias.push(Date.now() - t0); if (latencias.length > 200) latencias.shift();
      exitos++;
      return r;
    } catch (e) {
      fallos++;
      throw ctl.signal.aborted ? new Error('timeout') : e;
    } finally { clearTimeout(t); }
  }

  function elegirSemilla(rol, dificultad, debiles) {
    const delRol = banco.filter(e => e.rol === rol || e.rol === 'todos');
    const lista = delRol.length ? delRol : banco;
    return lista.find(e => e.tacticas.some(t => debiles.includes(t)))
        || lista.find(e => e.dificultad === dificultad) || lista[0];
  }

  return {
    proveedor: nombre,
    modelo: env.LLM_MODEL || proveedor.modeloPorDefecto || '-',

    estadisticas() {
      return { proveedor: nombre, exitos, fallos, latencia_p50_ms: percentil(latencias, 0.5), latencia_p90_ms: percentil(latencias, 0.9) };
    },

    /** Genera un escenario nuevo usando una plantilla del banco como semilla (RF03). */
    async generarEscenario({ rol = 'contador', dificultad = 1, tacticasDebiles = [], humor = 1, canal = null } = {}) {
      const semilla = elegirSemilla(rol, dificultad, tacticasDebiles);
      const prompt = `Genera UN escenario de entrenamiento anti-phishing para el rol "${rol}", dificultad ${dificultad}/3,
priorizando estas tácticas: ${tacticasDebiles.join(', ') || 'cualquiera'}${canal ? `, canal "${canal}"` : ''}.
Tácticas válidas: ${TACTICAS.join(', ')}. Canales válidos: correo, chat, sms, llamada, presencial.
Debe ser distinto a la plantilla pero con la misma estructura. Nivel de humor del debrief: ${['serio', 'algo de humor', 'chistoso'][humor] || 'algo de humor'}.
El debrief nunca culpa al usuario. Si el canal es "llamada" incluye "guion" (3 frases del atacante) y "palabras_clave_correctas".
Devuelve SOLO JSON con esta estructura (sin el campo id): ${JSON.stringify({ ...semilla, id: undefined })}`;
      try {
        const crudo = extraerJSON(await llamar({ prompt, json: true }));
        const esc = sanitizar(crudo);
        esc.dificultad = Number(esc.dificultad);
        const errores = validarEscenario(esc, TACTICAS);
        if (errores.length) throw new Error('escenario inválido: ' + errores.join(', '));
        esc.rol = esc.rol && esc.rol !== 'todos' ? esc.rol : rol;
        esc.accion_correcta = esc.accion_correcta || semilla.accion_correcta;
        return { ...esc, id: 'G' + Date.now().toString(36).toUpperCase(), origen: nombre, generado: true, semilla: semilla.id };
      } catch (e) {
        console.warn('[LLM] generarEscenario:', e.message);
        return { ...semilla, origen: 'banco', generado: false, motivo: e.message };
      }
    },

    /** Evalúa la respuesta (texto o transcripción de voz) del usuario a una llamada (RF06, RF08). */
    async evaluarRespuesta({ escenario, respuesta }) {
      const reglas = evaluarPorReglas(escenario, respuesta);
      if (reglas.decidido) return { ...reglas, origen: 'reglas' };
      const prompt = `Escenario de vishing (el usuario recibe la llamada): ${JSON.stringify({ guion: escenario.guion, senales: escenario.senales })}
Respuesta del usuario (transcrita de voz): "${String(respuesta).slice(0, 400)}".
¿La respuesta protege al usuario (se niega, cuelga, verifica por canal oficial) o entrega información/accede?
Devuelve SOLO JSON: {"seguro": boolean, "decidido": boolean, "senales_detectadas": [string], "comentario": string}.
"decidido" es false si la respuesta es ambigua y la conversación debe seguir.`;
      try {
        const r = extraerJSON(await llamar({ prompt, json: true }));
        return { seguro: !!r.seguro, decidido: r.decidido !== false, senales_detectadas: sanitizar(r.senales_detectadas || []),
          comentario: limpiarTexto(r.comentario || ''), origen: nombre };
      } catch {
        return { ...reglas, origen: 'reglas' };
      }
    },

    /** Conversación libre con el sensei (asistente por voz, P16). */
    async conversar({ pregunta, perfil = {}, escenario = null, tono = {} }) {
      const humor = ['serio', 'con algo de humor', 'chistoso'][tono.humor ?? perfil.humor ?? 1];
      const prompt = `Perfil del colaborador: rol ${perfil.rol || 'desconocido'}, nivel ${perfil.nivel || 1}, tácticas débiles: ${(tono.debiles || []).join(', ') || 'ninguna'}.
${tono.suave ? 'Declaró que se siente ' + tono.emocion + ': responde con calma y ánimo.' : ''}
${escenario ? 'Último combate: ' + JSON.stringify({ titulo: escenario.titulo, es_ataque: escenario.es_ataque, senales: escenario.senales, debrief: escenario.debrief }) : ''}
Pregunta (dicha por voz): "${String(pregunta).slice(0, 500)}"
Responde como el sensei, tono ${humor}, en máximo 3 oraciones cortas porque se leerá en voz alta. Sin listas ni emojis.`;
      try {
        const r = limpiarTexto((await llamar({ prompt }, Math.max(timeout, 6000))).trim());
        if (!r) throw new Error('vacía');
        return { respuesta: r, origen: nombre };
      } catch (e) {
        console.warn('[LLM] sensei:', e.message);
        return { respuesta: senseiPorReglas(pregunta, escenario), origen: 'reglas' };
      }
    },
  };
}
