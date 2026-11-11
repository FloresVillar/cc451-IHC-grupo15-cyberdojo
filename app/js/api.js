// Cliente del API con modo sin conexión (RF21, HU22).
// - Si el servidor responde, todo se guarda allá (perfil, combates, salas).
// - Si no hay red o se abrió el archivo con doble clic, la app sigue con el banco local y guarda
//   los combates en una cola; al reconectar se envían en lote y el servidor descarta duplicados.
(function (g) {
  const LS = {
    get: (k, d = null) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { /* nada */ } },
  };
  const conHttp = location.protocol.startsWith('http');
  let servidor = conHttp ? null : false; // null = desconocido
  const oyentes = new Set();

  class ErrorApi extends Error { constructor(msg, status, offline) { super(msg); this.status = status; this.offline = offline; } }

  function marcarServidor(v) {
    if (servidor !== v) { servidor = v; oyentes.forEach(f => f(v)); }
  }

  async function pedir(metodo, ruta, body, { admin = false, timeout = 9000, reintento = true } = {}) {
    if (!conHttp) throw new ErrorApi('Sin servidor', 0, true);
    const token = LS.get(admin ? 'cyberdojo_token_admin' : 'cyberdojo_token');
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    let r;
    try {
      r = await fetch(ruta, { method: metodo, signal: ctl.signal, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
        body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      marcarServidor(false);
      throw new ErrorApi('No hay conexión con el servidor', 0, true);
    } finally { clearTimeout(t); }
    marcarServidor(true);
    // El token dura 1 h. Si venció, se renueva en silencio con el correo guardado (demo sin contraseña).
    if (r.status === 401 && reintento) {
      const email = LS.get(admin ? 'cyberdojo_email_admin' : 'cyberdojo_email');
      if (email) { await API.login(email, '', { admin }); return pedir(metodo, ruta, body, { admin, timeout, reintento: false }); }
    }
    const datos = (r.headers.get('content-type') || '').includes('json') ? await r.json() : await r.text();
    if (!r.ok) throw new ErrorApi(datos.error || 'Error ' + r.status, r.status, false);
    return datos;
  }

  const cola = () => LS.get('cyberdojo_cola', []);
  const encolar = item => { const c = cola(); c.push(item); LS.set('cyberdojo_cola', c); };

  const API = {
    LS,
    get enLinea() { return servidor === true; },
    alCambiar(f) { oyentes.add(f); },
    pendientes: () => cola().length,

    async salud() {
      try { const s = await pedir('GET', '/api/salud', null, { timeout: 3000 }); return s; } catch (e) { return null; }
    },

    async login(email, org, { admin = false } = {}) {
      const r = await pedir('POST', '/api/auth/login', { email, org }, { reintento: false });
      LS.set(admin ? 'cyberdojo_token_admin' : 'cyberdojo_token', r.token);
      LS.set(admin ? 'cyberdojo_email_admin' : 'cyberdojo_email', email);
      return r;
    },
    salir() { ['cyberdojo_token', 'cyberdojo_email', 'cyberdojo_token_admin', 'cyberdojo_email_admin', 'cyberdojo_cola'].forEach(LS.del); },
    tieneSesion: () => !!LS.get('cyberdojo_token'),
    tieneAdmin: () => !!LS.get('cyberdojo_token_admin'),

    perfil: () => pedir('GET', '/api/perfil'),
    async guardarPerfil(campos) {
      try { return await pedir('PATCH', '/api/perfil', campos); } catch (e) { if (e.offline) encolar({ tipo: 'perfil', datos: campos }); else throw e; return null; }
    },
    async emocion(momento, valor) {
      try { return await pedir('POST', '/api/perfil/emocion', { momento, valor }); } catch (e) { if (e.offline) encolar({ tipo: 'emocion', datos: { momento, valor } }); return null; }
    },
    async combate(c) {
      if (!API.tieneSesion()) { encolar({ tipo: 'combate', datos: c }); return null; }
      try { return await pedir('POST', '/api/combates', c); } catch (e) { if (e.offline) { encolar({ tipo: 'combate', datos: c }); return null; } throw e; }
    },

    /** Envía todo lo pendiente. Devuelve el perfil actualizado o null. */
    async sincronizar() {
      const c = cola();
      if (!c.length || !API.tieneSesion()) return null;
      try {
        for (const x of c.filter(x => x.tipo === 'perfil')) await pedir('PATCH', '/api/perfil', x.datos);
        for (const x of c.filter(x => x.tipo === 'emocion')) await pedir('POST', '/api/perfil/emocion', x.datos);
        const combates = c.filter(x => x.tipo === 'combate').map(x => x.datos);
        let r = null;
        if (combates.length) r = await pedir('POST', '/api/combates/lote', { combates });
        LS.set('cyberdojo_cola', []);
        return { perfil: r ? r.perfil : await API.perfil(), sincronizados: r ? r.sincronizados : 0 };
      } catch (e) { return null; }
    },

    escenarios: () => pedir('GET', '/api/escenarios'),
    siguiente: ia => pedir('GET', '/api/escenarios/siguiente' + (ia ? '?ia=1' : ''), null, { timeout: 60000 }),
    evaluar: (escenarioId, respuesta) => pedir('POST', '/api/evaluar', { escenarioId, respuesta }, { timeout: 30000 }),
    sensei: (pregunta, escenarioId) => pedir('POST', '/api/sensei', { pregunta, escenarioId }, { timeout: 60000 }),

    salas: () => pedir('GET', '/api/salas'),
    sala: codigo => pedir('GET', '/api/salas/' + encodeURIComponent(codigo)),
    crearSala: (nombre, equipos) => pedir('POST', '/api/salas', { nombre, equipos }),
    unirse: (codigo, equipo) => pedir('POST', `/api/salas/${encodeURIComponent(codigo)}/unirse`, { equipo }),
    tablero: codigo => pedir('GET', `/api/salas/${encodeURIComponent(codigo)}/tablero`),
    crearTorneo: (codigo, datos, admin) => pedir('POST', `/api/salas/${encodeURIComponent(codigo)}/torneos`, datos, { admin }),
    qrURL: codigo => `/api/salas/${encodeURIComponent(codigo)}/qr.svg?origen=${encodeURIComponent(location.origin)}`,

    /** Escucha los eventos en vivo de una sala (SSE). Devuelve una función para cerrar. */
    eventos(codigo, manejadores) {
      if (!conHttp || !g.EventSource) return () => {};
      const es = new EventSource(`/api/salas/${encodeURIComponent(codigo)}/eventos?token=${encodeURIComponent(LS.get('cyberdojo_token') || '')}`);
      Object.entries(manejadores).forEach(([ev, fn]) => es.addEventListener(ev, e => fn(JSON.parse(e.data))));
      es.onerror = () => manejadores.error && manejadores.error();
      return () => es.close();
    },

    admin: {
      metricas: () => pedir('GET', '/api/admin/metricas', null, { admin: true }),
      async csv() {
        const token = LS.get('cyberdojo_token_admin');
        const r = await fetch('/api/admin/metricas.csv', { headers: { authorization: 'Bearer ' + token } });
        if (!r.ok) throw new ErrorApi('No se pudo exportar', r.status);
        return r.blob();
      },
      escenarios: () => pedir('GET', '/api/admin/escenarios', null, { admin: true }),
      generar: datos => pedir('POST', '/api/admin/escenarios/generar', datos, { admin: true, timeout: 60000 }),
      actualizar: (id, datos) => pedir('PUT', '/api/admin/escenarios/' + encodeURIComponent(id), datos, { admin: true }),
      salas: () => pedir('GET', '/api/salas', null, { admin: true }),
    },
  };

  g.addEventListener('online', () => { marcarServidor(null); API.salud(); });
  g.addEventListener('offline', () => marcarServidor(false));
  g.API = API;
})(window);
