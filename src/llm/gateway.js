// LLM Gateway: una sola interfaz para la app, varios proveedores detrás (RF04, RNF08, RNF10).
// Cambiar de proveedor = cambiar LLM_PROVIDER en .env. El resto del código no se entera.
import { readFileSync } from 'node:fs';
import { anthropic, openai, ollama, mock } from './providers.js';
import { sanitizar } from './guardrails.js';

const PROVEEDORES = { anthropic, openai, ollama, mock };
const BANCO = JSON.parse(readFileSync(new URL('../../data/escenarios.json', import.meta.url))).escenarios;

export function crearGateway(env = process.env) {
  const nombre = env.LLM_PROVIDER || 'mock';
  const proveedor = PROVEEDORES[nombre];
  if (!proveedor) throw new Error(`Proveedor LLM desconocido: ${nombre}`);
  const timeout = Number(env.LLM_TIMEOUT_MS || 3000);

  async function conTimeout(promesa) {
    return Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout))]);
  }

  return {
    proveedor: nombre,

    /** Genera un escenario nuevo usando una plantilla del banco como semilla. */
    async generarEscenario({ rol, dificultad, tacticasDebiles = [], humor = 1 }) {
      const semilla = elegirSemilla(rol, dificultad, tacticasDebiles);
      const prompt = promptEscenario({ rol, dificultad, tacticasDebiles, humor, semilla });
      try {
        const texto = await conTimeout(proveedor.completar(prompt, env));
        const esc = sanitizar(JSON.parse(texto));
        return { ...esc, origen: nombre, generado: true };
      } catch (e) {
        // Fallback: si el LLM falla o tarda, usamos el escenario del banco tal cual.
        return { ...semilla, origen: 'banco', generado: false, motivo: e.message };
      }
    },

    /** Evalúa la respuesta (texto o transcripción de voz) del usuario a un escenario. */
    async evaluarRespuesta({ escenario, respuesta }) {
      const prompt = `Eres evaluador de un entrenamiento de ciberseguridad. Escenario: ${JSON.stringify(escenario)}.
Respuesta del usuario: "${respuesta}". Devuelve SOLO JSON: {"seguro":bool,"senales_detectadas":[string],"comentario":string}.
El comentario debe ser breve, amable y sin culpa.`;
      try {
        return JSON.parse(await conTimeout(proveedor.completar(prompt, env)));
      } catch {
        const s = respuesta.toLowerCase();
        const seguro = (escenario.palabras_clave_correctas || []).some(k => s.includes(k));
        return { seguro, senales_detectadas: [], comentario: escenario.debrief };
      }
    },
  };
}

function elegirSemilla(rol, dificultad, debiles) {
  const delRol = BANCO.filter(e => e.rol === rol || e.rol === 'todos');
  return delRol.find(e => e.tacticas.some(t => debiles.includes(t)))
      || delRol.find(e => e.dificultad === dificultad) || delRol[0];
}

function promptEscenario({ rol, dificultad, tacticasDebiles, humor, semilla }) {
  return `Genera un escenario de entrenamiento anti-phishing en español peruano para el rol "${rol}",
dificultad ${dificultad}/3, priorizando las tácticas: ${tacticasDebiles.join(', ') || 'cualquiera'}.
Usa SOLO empresas y dominios ficticios con TLD .test. No incluyas instrucciones de malware ni datos reales.
Nivel de humor del debrief: ${['serio', 'algo de humor', 'chistoso'][humor]}. Nunca culpes al usuario.
Devuelve SOLO JSON con la misma estructura que este ejemplo: ${JSON.stringify(semilla)}`;
}
