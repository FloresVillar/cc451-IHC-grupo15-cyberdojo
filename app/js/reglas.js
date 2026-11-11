// Reglas de negocio compartidas entre la PWA (offline) y el servidor (online).
// Es un script clásico sin import/export: en el navegador se carga con <script>
// y en Node se importa por efecto (import '../../app/js/reglas.js'), así las dos
// partes calculan puntos, cinturones y dificultad exactamente igual (RF08, RF10, RF12).
(function (g) {
  const CINTURONES = [
    { n: 'Blanco', c: '#ffffff', min: 0 }, { n: 'Amarillo', c: '#f2c94c', min: 100 },
    { n: 'Naranja', c: '#f2994a', min: 250 }, { n: 'Verde', c: '#4f9a5a', min: 450 },
    { n: 'Azul', c: '#2f6fb0', min: 700 }, { n: 'Marrón', c: '#7a4b2a', min: 1000 },
    { n: 'Negro', c: '#1f1d1a', min: 1400 }];

  const TACTICAS = {
    urgencia: 'Urgencia', autoridad: 'Autoridad', verificacion_remitente: 'Remitente', enlaces: 'Enlaces',
    adjuntos: 'Adjuntos', datos_por_telefono: 'Datos por teléfono', acceso_fisico: 'Acceso físico',
    falso_positivo: 'Mensajes legítimos' };

  const EMOCIONES_BAJAS = ['estresado', 'cansado', 'frustrado', 'confundido'];

  function cinturon(puntos) {
    let b = 0;
    CINTURONES.forEach((x, i) => { if (puntos >= x.min) b = i; });
    return b;
  }

  function perfilVacio(extra) {
    return Object.assign({
      email: '', nombre: '', rol: 'contador', equipo: null, alias: '', useAlias: false,
      humor: 1, voz: true, subs: true, fs: 1, sonidos: true, nivel: 1, puntos: 0,
      stats: {}, hist: [], emociones: [], ritmo: { msProm: 0, n: 0 }, calibrado: false, logros: [],
    }, extra || {});
  }

  /** Tácticas con acierto < 60 %, de la más débil a la menos débil (HU10). */
  function tacticasDebiles(p) {
    return Object.entries(p.stats || {})
      .map(([t, s]) => [t, s.total ? s.ok / s.total : 1])
      .filter(([, r]) => r < 0.6).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  }

  /** Última emoción declarada (antes o después de un combate). */
  function ultimaEmocion(p) {
    const e = (p.emociones || [])[p.emociones.length - 1];
    return e ? e.valor : null;
  }

  /** Tono que usa el sensei según el estado emocional declarado (RF11, diseño emocional). */
  function tonoSensei(p) {
    const emo = ultimaEmocion(p);
    const baja = EMOCIONES_BAJAS.includes(emo);
    return {
      humor: baja ? Math.min(p.humor, 1) : p.humor,
      rate: baja ? 0.92 : 1.02,
      modoPractica: emo === 'estresado' || emo === 'cansado',
      suave: baja,
      emocion: emo,
    };
  }

  function escenariosDelRol(p, escenarios) {
    return escenarios.filter(e => e.rol === p.rol || e.rol === 'todos' || p.rol === 'otro' || p.rol === 'admin');
  }

  /** Elige el siguiente combate: primero tácticas débiles, luego la dificultad actual (HU03, HU10). */
  function sugerir(p, escenarios) {
    const delRol = escenariosDelRol(p, escenarios);
    const hechos = new Set((p.hist || []).map(h => h.id));
    const pendientes = delRol.filter(e => !hechos.has(e.id));
    const lista = pendientes.length ? pendientes : delRol;
    const debiles = tacticasDebiles(p);
    const tono = tonoSensei(p);
    const nivel = tono.suave ? Math.max(1, p.nivel - 1) : p.nivel;
    return lista.find(e => e.tacticas.some(t => debiles.includes(t)) && e.dificultad <= nivel + 1)
        || lista.find(e => e.dificultad === nivel) || lista[0];
  }

  /** Puntos de un combate de mensaje (correo, chat, SMS, presencial). */
  function puntosMensaje(e, accion, inspeccionados, pistas) {
    const ok = e.es_ataque ? (accion === 'reportar' || accion === 'verificar') : accion === 'legitimo';
    let pts = ok ? Math.max(20, 40 + e.dificultad * 20 + inspeccionados * 10 - pistas * 10) : 10;
    if (!e.es_ataque && !ok && (accion === 'reportar' || accion === 'verificar')) pts = 20; // prudente
    return { ok, pts };
  }

  /** Puntos de una llamada de vishing según cómo terminó (HU06). */
  function puntosLlamada(e, final, turno) {
    const ok = final === 'ok' || final === 'colgar' || final === 'rechazar';
    const pts = { ok: 60 + e.dificultad * 20 - turno * 5, colgar: 40 + e.dificultad * 15, rechazar: 30, corte: 20, cayo: 10 }[final] ?? 10;
    return { ok, pts: Math.max(10, pts) };
  }

  /**
   * Aplica el resultado de un combate al perfil (PerfilService + DificultadService).
   * Muta y devuelve el perfil. Regla: 3 aciertos seguidos suben el nivel, 2 errores seguidos lo bajan.
   */
  function aplicarCombate(p, c) {
    const antes = cinturon(p.puntos);
    (c.tacticas || []).forEach(t => {
      p.stats[t] = p.stats[t] || { ok: 0, total: 0 };
      p.stats[t].total++;
      if (c.ok) p.stats[t].ok++;
    });
    p.hist.unshift({ id: c.escenarioId, t: c.titulo, ok: c.ok, pts: c.puntos, canal: c.canal,
      fecha: c.fecha || new Date().toISOString(), ms: c.ms || null, accion: c.accion || null });
    p.hist = p.hist.slice(0, 50);
    const ult = p.hist.slice(0, 3);
    if (ult.length === 3 && ult.every(h => h.ok)) p.nivel = Math.min(3, p.nivel + 1);
    if (p.hist.length >= 2 && !p.hist[0].ok && !p.hist[1].ok) p.nivel = Math.max(1, p.nivel - 1);
    if (c.ms && c.ms > 0 && c.ms < 15 * 60 * 1000) {
      p.ritmo = p.ritmo || { msProm: 0, n: 0 };
      p.ritmo.msProm = Math.round((p.ritmo.msProm * p.ritmo.n + c.ms) / (p.ritmo.n + 1));
      p.ritmo.n++;
    }
    p.puntos += c.puntos;
    const nuevos = revisarLogros(p, c);
    return { perfil: p, cinturonAntes: antes, cinturonDespues: cinturon(p.puntos), logrosNuevos: nuevos };
  }

  const LOGROS = {
    primer_combate: '🥋 Primer combate',
    primer_reporte: '🚩 Primer reporte',
    colgaste_a_tiempo: '📵 Colgaste a tiempo',
    racha_3: '🔥 Tres seguidos',
    ojo_de_halcon: '🔎 Ojo de halcón (revisaste 3 señales)',
    volviste: '💪 Volviste después de caer',
  };

  function revisarLogros(p, c) {
    p.logros = p.logros || [];
    const tiene = new Set(p.logros);
    const nuevos = [];
    const dar = k => { if (!tiene.has(k)) { p.logros.push(k); nuevos.push(k); } };
    if (p.hist.length >= 1) dar('primer_combate');
    if (c.accion === 'reportar' && c.ok) dar('primer_reporte');
    if (c.canal === 'llamada' && c.ok) dar('colgaste_a_tiempo');
    if (p.hist.length >= 3 && p.hist.slice(0, 3).every(h => h.ok)) dar('racha_3');
    if ((c.inspeccionados || 0) >= 3) dar('ojo_de_halcon');
    if (c.ok && p.hist[1] && !p.hist[1].ok) dar('volviste');
    return nuevos;
  }

  const normal = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  /**
   * Evalúa por reglas lo que el usuario dijo o escribió en una llamada (primera pasada, sin LLM).
   * decidido=false significa que la respuesta es ambigua: el cliente puede consultar al LLM o seguir la conversación.
   */
  function evaluarRespuesta(e, respuesta) {
    const s = normal(respuesta);
    const malas = /(le doy|ahi le|el codigo es|te paso|le paso|se lo doy|aqui tiene|claro,? (el|mi) (codigo|clave)|\b\d{4,}\b)/;
    if (malas.test(s)) return { seguro: false, decidido: true, senales_detectadas: [] };
    const claves = (e.palabras_clave_correctas || []).map(normal);
    const buenas = /(colgar|cuelgo|oficial|no comparto|no doy|no voy a dar|verific|devuelvo la llamada|lo llamo yo|reportar|no puedo dar)/;
    if (claves.some(k => s.includes(k)) || buenas.test(s)) return { seguro: true, decidido: true, senales_detectadas: [] };
    return { seguro: false, decidido: false, senales_detectadas: [] };
  }

  /** Frase del sensei: nunca culpa al usuario (RNF12). */
  function fraseSensei(ok, humor) {
    const L = [
      ['Bien hecho. Detectaste el ataque.', 'Así se hace: no picaste.', '¡Ni el ninja más sigiloso pasa contigo! 🥋'],
      ['Esta vez el atacante ganó. Veamos qué pasó.', 'Te la jugaron, pasa en las mejores familias.', 'Caíste con estilo, eso sí. Hasta los maestros resbalan en el tatami. 😅']];
    return L[ok ? 0 : 1][Math.max(0, Math.min(2, humor))];
  }

  /** Resumen reflexivo para el "diario del guardián" (nivel reflexivo de Norman). */
  function diario(p) {
    const semana = Date.now() - 7 * 864e5;
    const h = (p.hist || []).filter(x => !x.fecha || Date.parse(x.fecha) >= semana);
    if (!h.length) return 'Todavía no hay combates esta semana. Uno corto de 2 minutos ya cuenta.';
    const ok = h.filter(x => x.ok).length;
    const mejores = Object.entries(p.stats || {}).filter(([, s]) => s.total >= 2)
      .sort((a, b) => b[1].ok / b[1].total - a[1].ok / a[1].total);
    const mejor = mejores[0] ? TACTICAS[mejores[0][0]] : null;
    let t = `Esta semana detectaste ${ok} de ${h.length} intentos de engaño.`;
    if (mejor) t += ` Tu punto fuerte: ${mejor}.`;
    t += ok >= h.length / 2 ? ' Cada reporte protege también a tu equipo.' : ' Cada caída en el dojo es una que no pasará en la oficina.';
    return t;
  }

  g.REGLAS = { CINTURONES, TACTICAS, LOGROS, EMOCIONES_BAJAS, cinturon, perfilVacio, tacticasDebiles,
    ultimaEmocion, tonoSensei, escenariosDelRol, sugerir, puntosMensaje, puntosLlamada, aplicarCombate,
    fraseSensei, diario, evaluarRespuesta };
})(typeof window !== 'undefined' ? window : globalThis);
