// API de aplicación de CyberDojo (contenedor "API" del C4). Sin frameworks: node:http + un router mínimo.
// Componentes: Auth, Perfil/Dificultad (app/js/reglas.js), Escenarios (LLM gateway), Evaluación,
// Salas/Torneos (SSE) y Admin (métricas agregadas y revisión de escenarios).
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { firmar, verificar } from './auth.js';
import { BANCO, TACTICAS } from '../llm/gateway.js';
import { validarEscenario, sanitizar } from '../llm/guardrails.js';
import '../../app/js/reglas.js';
const R = globalThis.REGLAS;

const RAIZ_APP = fileURLToPath(new URL('../../app/', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const VERSION = '0.3.0';
const MIN_GRUPO = 3; // k-anonimato: no se muestran métricas de grupos con menos de 3 personas

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function enviarJSON(res, status, datos) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(datos));
}

async function leerCuerpo(req, limite = 100_000) {
  let tam = 0; const partes = [];
  for await (const p of req) { tam += p.length; if (tam > limite) throw new HttpError(413, 'Cuerpo demasiado grande'); partes.push(p); }
  if (!partes.length) return {};
  try { return JSON.parse(Buffer.concat(partes).toString()); } catch { throw new HttpError(400, 'JSON inválido'); }
}

function limitador(max, ventanaMs = 60000) {
  const mapa = new Map();
  return clave => {
    const ahora = Date.now();
    const e = mapa.get(clave) || { n: 0, desde: ahora };
    if (ahora - e.desde > ventanaMs) { e.n = 0; e.desde = ahora; }
    e.n++; mapa.set(clave, e);
    if (mapa.size > 5000) mapa.clear();
    return e.n <= max;
  };
}

const nombreVisible = u => (u.useAlias && u.alias) ? u.alias : (u.nombre ? u.nombre.split(' ')[0] + ' ' + (u.nombre.split(' ')[1] || '').charAt(0) + '.' : u.email.split('@')[0]);

/** Perfil que se envía al cliente: sin campos internos. */
function perfilPublico(u) {
  const { esAdmin, ...resto } = u;
  return { ...resto, esAdmin: !!esAdmin, cinturon: R.cinturon(u.puntos || 0) };
}

export function estadoTorneo(t, ahora = Date.now()) {
  const ini = Date.parse(t.inicio), fin = ini + t.duracion_min * 60000;
  const estado = ahora < ini ? 'programado' : ahora < fin ? 'en_curso' : 'finalizado';
  return { ...t, estado, restante_s: Math.max(0, Math.round((fin - Math.max(ahora, ini)) / 1000)) };
}

export function crearApp({ env = process.env, store, gateway, hub }) {
  const db = store.db;
  const secreto = env.JWT_SECRET || db.meta.jwtSecret;
  const limiteApi = limitador(Number(env.RATE_LIMIT || 240));
  const limiteLLM = limitador(Number(env.RATE_LIMIT_LLM || 30));
  const rutas = [];
  const ruta = (metodo, patron, fn, opciones = {}) => {
    const claves = [];
    const re = new RegExp('^' + patron.replace(/:(\w+)/g, (_, k) => { claves.push(k); return '([^/]+)'; }) + '$');
    rutas.push({ metodo, re, claves, fn, ...opciones });
  };

  const escenario = id => BANCO.find(e => e.id === id) || db.generados.find(g => g.id === id);
  const aprobados = () => [...BANCO, ...db.generados.filter(g => g.estado === 'aprobado')];

  function autenticar(req, url) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : url.searchParams.get('token');
    const datos = verificar(token, secreto);
    if (!datos) throw new HttpError(401, 'Sesión vencida o inválida. Vuelve a ingresar.');
    const u = store.usuarioPorId(datos.sub);
    if (!u) throw new HttpError(401, 'Usuario no encontrado');
    return u;
  }
  const soloAdmin = u => { if (!u.esAdmin) throw new HttpError(403, 'Solo para el administrador'); };

  function infoSala(s) {
    const conectados = hub.conectados(s.codigo);
    const miembros = s.equipos.flatMap(e => e.miembros.map(id => store.usuarioPorId(id)).filter(Boolean)
      .map(u => ({ id: u.id, nombre: nombreVisible(u), equipo: e.nombre, cinturon: R.cinturon(u.puntos || 0), conectado: conectados.has(u.id) })));
    miembros.sort((a, b) => b.conectado - a.conectado);
    return { codigo: s.codigo, nombre: s.nombre, admin: s.admin,
      equipos: s.equipos.map(e => ({ nombre: e.nombre, puntos: e.puntos, miembros: e.miembros.length })),
      miembros, conectados: conectados.size, torneos: s.torneos.map(t => estadoTorneo(t)) };
  }
  const emitirSala = s => hub.emitir(s.codigo, 'sala', infoSala(s));
  const equipoDe = (s, uid) => s.equipos.find(e => e.miembros.includes(uid));

  function registrarCombate(u, c) {
    if (c.idLocal && db.combates.some(x => x.usuarioId === u.id && x.idLocal === c.idLocal)) return { duplicado: true }; // HU22: sin duplicados
    const e = escenario(c.escenarioId);
    if (!e) throw new HttpError(404, 'Escenario no encontrado: ' + c.escenarioId);
    const ins = Math.max(0, Math.min(10, Number(c.inspeccionados) || 0));
    const pistas = Math.max(0, Math.min(2, Number(c.pistas) || 0));
    // El servidor recalcula el puntaje: no confía en los puntos que manda el cliente.
    const { ok, pts } = e.canal === 'llamada'
      ? R.puntosLlamada(e, c.final, Math.max(0, Number(c.turno) || 0))
      : R.puntosMensaje(e, c.accion, ins, pistas);
    const reg = { id: 'c' + randomBytes(5).toString('hex'), idLocal: c.idLocal || null, usuarioId: u.id, equipo: u.equipo,
      escenarioId: e.id, canal: e.canal, tacticas: e.tacticas, es_ataque: e.es_ataque, ok, accion: c.accion || c.final, puntos: pts,
      ms: Number(c.ms) || null, fecha: c.fecha && Date.parse(c.fecha) ? new Date(c.fecha).toISOString() : new Date().toISOString(),
      inspeccionados: ins, pistas, offline: !!c.offline };
    db.combates.push(reg);
    const r = R.aplicarCombate(u, { ...reg, titulo: e.titulo });
    // Torneo: los puntos van al equipo y se avisan en vivo a toda la sala
    if (c.torneo && c.torneo.sala) {
      const s = store.sala(c.torneo.sala);
      const t = s && s.torneos.find(x => x.id === c.torneo.id);
      const eq = s && equipoDe(s, u.id);
      if (t && eq && estadoTorneo(t).estado === 'en_curso' && t.escenarios.includes(e.id)) {
        t.marcador[eq.nombre] = (t.marcador[eq.nombre] || 0) + pts;
        eq.puntos += pts;
        hub.emitir(s.codigo, 'marcador', { torneo: t.id, marcador: t.marcador, ultimo: { equipo: eq.nombre, puntos: pts, quien: nombreVisible(u) } });
      }
    }
    store.guardar();
    return { combate: reg, ok, puntos: pts, subioCinturon: r.cinturonDespues > r.cinturonAntes, cinturon: r.cinturonDespues, logrosNuevos: r.logrosNuevos };
  }

  /* ---------------- rutas ---------------- */
  ruta('GET', '/api/salud', () => ({ ok: true, version: VERSION, llm: { proveedor: gateway.proveedor, modelo: gateway.modelo, ...gateway.estadisticas() },
    usuarios: db.usuarios.length, salas: db.salas.length }), { publica: true });

  ruta('POST', '/api/auth/login', async (req, _u, _p, body) => {
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Escribe un correo válido, por ejemplo nombre@empresa.com');
    const org = String(body.org || '').trim().toUpperCase();
    if (org && org !== (env.ORG_CODE || 'KALLPA')) throw new HttpError(404, 'No encontramos ese código de organización. Pídeselo al área de TI o deja el campo vacío.');
    let u = store.usuarioPorEmail(email);
    let nuevo = false;
    if (!u) { u = store.crearUsuario({ email, nombre: '' }); nuevo = true; }
    return { token: firmar({ sub: u.id, rol: u.rol }, secreto, 3600), usuario: perfilPublico(u), nuevo };
  }, { publica: true });

  ruta('GET', '/api/perfil', (_r, u) => perfilPublico(u));

  ruta('PATCH', '/api/perfil', (_r, u, _p, b) => {
    const permitidos = ['rol', 'alias', 'useAlias', 'humor', 'voz', 'subs', 'fs', 'sonidos', 'nombre', 'nivel', 'calibrado', 'rate'];
    for (const k of permitidos) if (k in b) u[k] = b[k];
    if (!['contador', 'desarrollador', 'recepcion', 'otro', 'admin'].includes(u.rol)) u.rol = 'otro';
    if (u.rol === 'admin' && !u.esAdmin) u.rol = 'otro';
    u.alias = String(u.alias || '').replace(/[<>]/g, '').slice(0, 24);
    u.humor = Math.max(0, Math.min(2, Number(u.humor) || 0));
    u.nivel = Math.max(1, Math.min(3, Number(u.nivel) || 1));
    if (!u.equipo) u.equipo = { contador: 'Finanzas', desarrollador: 'TI', recepcion: 'Operaciones' }[u.rol] || null;
    store.guardar();
    return perfilPublico(u);
  });

  ruta('POST', '/api/perfil/emocion', (_r, u, _p, b) => {
    const valor = String(b.valor || '').toLowerCase().slice(0, 20);
    if (!valor) throw new HttpError(400, 'Falta la emoción');
    u.emociones.push({ fecha: new Date().toISOString(), momento: b.momento === 'despues' ? 'despues' : 'antes', valor });
    u.emociones = u.emociones.slice(-60);
    store.guardar();
    return { ok: true, tono: R.tonoSensei(u) };
  });

  ruta('POST', '/api/combates', (_r, u, _p, b) => ({ ...registrarCombate(u, b), perfil: perfilPublico(u) }));

  ruta('POST', '/api/combates/lote', (_r, u, _p, b) => {
    const lista = Array.isArray(b.combates) ? b.combates.slice(0, 100) : [];
    const resultados = lista.map(c => { try { return registrarCombate(u, { ...c, offline: true }); } catch (e) { return { error: e.message }; } });
    return { sincronizados: resultados.filter(r => r.combate).length, duplicados: resultados.filter(r => r.duplicado).length, perfil: perfilPublico(u) };
  });

  ruta('GET', '/api/escenarios', () => ({ escenarios: aprobados(), tacticas: TACTICAS }), { publica: true });

  ruta('GET', '/api/escenarios/siguiente', async (req, u, _p, _b, url) => {
    if (url.searchParams.get('ia') !== '1') return { escenario: R.sugerir(u, aprobados()), origen: 'reglas' };
    if (!limiteLLM(u.id)) throw new HttpError(429, 'Muchas solicitudes a la IA. Espera un minuto.');
    const tono = R.tonoSensei(u);
    const nivel = tono.suave ? Math.max(1, u.nivel - 1) : u.nivel;
    const esc = await gateway.generarEscenario({ rol: u.rol === 'otro' || u.rol === 'admin' ? 'todos' : u.rol, dificultad: nivel,
      tacticasDebiles: R.tacticasDebiles(u), humor: tono.humor, canal: url.searchParams.get('canal') || null });
    if (esc.generado) {
      db.generados.push({ ...esc, estado: 'practica', paraUsuario: u.id, fecha: new Date().toISOString() });
      store.guardar();
    }
    return { escenario: esc, origen: esc.origen, motivo: esc.motivo || null };
  });

  ruta('POST', '/api/evaluar', async (_r, u, _p, b) => {
    if (!limiteLLM(u.id)) throw new HttpError(429, 'Muchas solicitudes. Espera un minuto.');
    const e = escenario(b.escenarioId);
    if (!e) throw new HttpError(404, 'Escenario no encontrado');
    return gateway.evaluarRespuesta({ escenario: e, respuesta: String(b.respuesta || '').slice(0, 500) });
  });

  ruta('POST', '/api/sensei', async (_r, u, _p, b) => {
    if (!limiteLLM(u.id)) throw new HttpError(429, 'El sensei necesita respirar. Espera un minuto.');
    const pregunta = String(b.pregunta || '').trim();
    if (!pregunta) throw new HttpError(400, 'Hazme una pregunta');
    const tono = { ...R.tonoSensei(u), debiles: R.tacticasDebiles(u).map(t => R.TACTICAS[t]) };
    return { ...(await gateway.conversar({ pregunta, perfil: u, escenario: b.escenarioId ? escenario(b.escenarioId) : null, tono })), tono };
  });

  /* ---- salas y torneos ---- */
  ruta('GET', '/api/salas', (_r, u) => ({ salas: db.salas.filter(s => (u.salas || []).includes(s.codigo) || u.esAdmin).map(infoSala) }));

  ruta('POST', '/api/salas', (_r, u, _p, b) => {
    const nombre = String(b.nombre || '').trim().slice(0, 60);
    if (!nombre) throw new HttpError(400, 'Ponle un nombre a la sala');
    const equipos = (Array.isArray(b.equipos) && b.equipos.length ? b.equipos : ['Equipo A', 'Equipo B']).slice(0, 8).map(n => String(n).trim().slice(0, 30)).filter(Boolean);
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo; do { codigo = Array.from(randomBytes(6), x => abc[x % abc.length]).join(''); } while (store.sala(codigo));
    const s = { codigo, nombre, admin: u.id, equipos: equipos.map(n => ({ nombre: n, miembros: [], puntos: 0 })), torneos: [] };
    db.salas.push(s);
    u.salas = [...new Set([...(u.salas || []), codigo])];
    store.guardar();
    return infoSala(s);
  });

  ruta('GET', '/api/salas/:codigo', (_r, _u, p) => {
    const s = store.sala(p.codigo); if (!s) throw new HttpError(404, 'No existe una sala con ese código');
    return infoSala(s);
  });

  ruta('POST', '/api/salas/:codigo/unirse', (_r, u, p, b) => {
    const s = store.sala(p.codigo); if (!s) throw new HttpError(404, 'No existe una sala con ese código. Revisa las 6 letras o pide el QR.');
    let eq = equipoDe(s, u.id);
    if (!eq) {
      eq = s.equipos.find(e => e.nombre === b.equipo) || s.equipos.find(e => e.nombre === u.equipo)
        || [...s.equipos].sort((a, c) => a.miembros.length - c.miembros.length)[0];
      eq.miembros.push(u.id);
    }
    u.salas = [...new Set([...(u.salas || []), s.codigo])];
    store.guardar(); emitirSala(s);
    return { ...infoSala(s), miEquipo: eq.nombre };
  });

  ruta('GET', '/api/salas/:codigo/eventos', (req, u, p, _b, _url, res) => {
    const s = store.sala(p.codigo); if (!s) throw new HttpError(404, 'Sala no encontrada');
    hub.suscribir(s.codigo, u.id, req, res, () => emitirSala(s));
    return undefined; // la respuesta queda abierta
  }, { stream: true });

  ruta('GET', '/api/salas/:codigo/tablero', (_r, u, p) => {
    const s = store.sala(p.codigo); if (!s) throw new HttpError(404, 'Sala no encontrada');
    const individual = s.equipos.flatMap(e => e.miembros.map(id => store.usuarioPorId(id)).filter(Boolean)
      .map(x => ({ nombre: nombreVisible(x), equipo: e.nombre, puntos: x.puntos || 0, cinturon: R.cinturon(x.puntos || 0), yo: x.id === u.id })))
      .sort((a, b) => b.puntos - a.puntos);
    return { equipos: s.equipos.map(e => ({ nombre: e.nombre, puntos: e.puntos })).sort((a, b) => b.puntos - a.puntos), individual };
  });

  ruta('POST', '/api/salas/:codigo/torneos', (_r, u, p, b) => {
    const s = store.sala(p.codigo); if (!s) throw new HttpError(404, 'Sala no encontrada');
    if (s.admin !== u.id && !u.esAdmin) throw new HttpError(403, 'Solo quien administra la sala puede crear torneos');
    const ids = (Array.isArray(b.escenarios) ? b.escenarios : []).slice(0, 10);
    const validos = new Set(aprobados().map(e => e.id));
    const noAprobados = ids.filter(id => !validos.has(id));
    if (!ids.length) throw new HttpError(400, 'Elige al menos un escenario');
    if (noAprobados.length) throw new HttpError(400, 'Estos escenarios no están aprobados: ' + noAprobados.join(', ')); // RF18
    const t = { id: 'T' + randomBytes(3).toString('hex').toUpperCase(), nombre: String(b.nombre || 'Torneo').slice(0, 60),
      inicio: b.inicio && Date.parse(b.inicio) ? new Date(b.inicio).toISOString() : new Date().toISOString(),
      duracion_min: Math.max(1, Math.min(240, Number(b.duracion_min) || 15)), escenarios: ids,
      marcador: Object.fromEntries(s.equipos.map(e => [e.nombre, 0])) };
    s.torneos.unshift(t);
    store.guardar(); emitirSala(s);
    return estadoTorneo(t);
  });

  ruta('GET', '/api/salas/:codigo/qr.svg', async (req, _u, p, _b, url, res) => {
    const s = store.sala(p.codigo); if (!s) throw new HttpError(404, 'Sala no encontrada');
    const origen = url.searchParams.get('origen') || `http://${req.headers.host}`;
    let QR; try { QR = (await import('qrcode')).default; } catch { throw new HttpError(501, 'Instala dependencias (npm install) para generar el QR'); }
    const svg = await QR.toString(`${origen}/app/#sala=${s.codigo}`, { type: 'svg', margin: 1, color: { dark: '#1f1d1a', light: '#ffffff' } });
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }); res.end(svg);
    return undefined;
  }, { publica: true, stream: true });

  /* ---- administrador ---- */
  function metricas() {
    const colab = db.usuarios.filter(u => !u.esAdmin);
    const porEquipo = {};
    for (const c of db.combates) {
      if (!c.equipo) continue;
      const m = porEquipo[c.equipo] ||= { equipo: c.equipo, usuarios: new Set(), combates: 0, ok: 0, ataques: 0, reportes: 0, tac: {} };
      m.usuarios.add(c.usuarioId); m.combates++; if (c.ok) m.ok++;
      if (c.es_ataque) { m.ataques++; if (['reportar', 'verificar', 'ok', 'colgar', 'rechazar'].includes(c.accion)) m.reportes++; }
      for (const t of c.tacticas) { const x = m.tac[t] ||= { ok: 0, total: 0 }; x.total++; if (c.ok) x.ok++; }
    }
    const areas = Object.values(porEquipo).map(m => {
      if (m.usuarios.size < MIN_GRUPO) return { equipo: m.equipo, insuficiente: true, usuarios: m.usuarios.size };
      const peor = Object.entries(m.tac).filter(([, x]) => x.total >= 3).sort((a, b) => a[1].ok / a[1].total - b[1].ok / b[1].total)[0];
      return { equipo: m.equipo, usuarios: m.usuarios.size, combates: m.combates, tasa_deteccion: Math.round(m.ok / m.combates * 100),
        tasa_reporte: m.ataques ? Math.round(m.reportes / m.ataques * 100) : null,
        tactica_mas_debil: peor ? peor[0] : null, tactica_mas_debil_tasa: peor ? Math.round(peor[1].ok / peor[1].total * 100) : null };
    });
    const semanas = [3, 2, 1, 0].map(w => {
      const desde = Date.now() - (w + 1) * 7 * 864e5, hasta = Date.now() - w * 7 * 864e5;
      const cs = db.combates.filter(c => { const f = Date.parse(c.fecha); return f >= desde && f < hasta; });
      return { semana: 4 - w, combates: cs.length, tasa_deteccion: cs.length ? Math.round(cs.filter(c => c.ok).length / cs.length * 100) : null };
    });
    const tacGlobal = {};
    for (const c of db.combates) for (const t of c.tacticas) { const x = tacGlobal[t] ||= { ok: 0, total: 0 }; x.total++; if (c.ok) x.ok++; }
    const tacticas = Object.entries(tacGlobal).map(([t, x]) => ({ tactica: t, nombre: R.TACTICAS[t], tasa: Math.round(x.ok / x.total * 100), total: x.total })).sort((a, b) => a.tasa - b.tasa);
    // Emociones: solo agregadas a nivel de organización y con al menos 5 check-ins (RNF05, HU11)
    const hace30 = Date.now() - 30 * 864e5;
    const emo = colab.flatMap(u => (u.emociones || []).filter(e => Date.parse(e.fecha) >= hace30).map(e => e.valor));
    const emociones = emo.length >= 5 ? Object.entries(emo.reduce((a, v) => (a[v] = (a[v] || 0) + 1, a), {})).map(([valor, n]) => ({ valor, pct: Math.round(n / emo.length * 100) })).sort((a, b) => b.pct - a.pct) : null;
    return { generado: new Date().toISOString(), colaboradores: colab.length, combates: db.combates.length, areas, semanas, tacticas, emociones,
      nota: `Datos agregados y anónimos. Grupos con menos de ${MIN_GRUPO} personas no se muestran. El check-in emocional nunca se muestra por persona.` };
  }

  ruta('GET', '/api/admin/metricas', (_r, u) => { soloAdmin(u); return metricas(); });

  ruta('GET', '/api/admin/metricas.csv', (_r, u, _p, _b, _url, res) => {
    soloAdmin(u);
    const m = metricas();
    const filas = [['area', 'usuarios', 'combates', 'tasa_deteccion', 'tasa_reporte', 'tactica_mas_debil', 'tasa_tactica_mas_debil'],
      ...m.areas.map(a => a.insuficiente ? [a.equipo, a.usuarios, '', '', '', 'datos insuficientes', ''] :
        [a.equipo, a.usuarios, a.combates, a.tasa_deteccion, a.tasa_reporte, a.tactica_mas_debil, a.tactica_mas_debil_tasa]),
      [], ['semana', 'combates', 'tasa_deteccion'], ...m.semanas.map(s => [s.semana, s.combates, s.tasa_deteccion ?? ''])];
    res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="cyberdojo_metricas.csv"' });
    res.end('﻿' + filas.map(f => f.join(',')).join('\n') + '\n');
    return undefined;
  }, { stream: true });

  ruta('GET', '/api/admin/escenarios', (_r, u) => {
    soloAdmin(u);
    return { generados: db.generados.map(g => ({ ...g })).reverse(), banco: BANCO.map(e => ({ id: e.id, titulo: e.titulo, rol: e.rol, canal: e.canal, dificultad: e.dificultad })) };
  });

  ruta('POST', '/api/admin/escenarios/generar', async (_r, u, _p, b) => {
    soloAdmin(u);
    if (!limiteLLM(u.id)) throw new HttpError(429, 'Espera un minuto antes de generar más');
    const esc = await gateway.generarEscenario({ rol: b.rol || 'contador', dificultad: Number(b.dificultad) || 2, tacticasDebiles: b.tacticas || [], canal: b.canal || null });
    if (!esc.generado) return { generado: false, motivo: esc.motivo, mensaje: 'El LLM no respondió (proveedor ' + gateway.proveedor + '): ' + esc.motivo };
    const g = { ...esc, estado: 'pendiente', fecha: new Date().toISOString() };
    db.generados.push(g); store.guardar();
    return { generado: true, escenario: g };
  });

  ruta('PUT', '/api/admin/escenarios/:id', (_r, u, p, b) => {
    soloAdmin(u);
    const g = db.generados.find(x => x.id === p.id); if (!g) throw new HttpError(404, 'Escenario no encontrado');
    const cambios = sanitizar({ titulo: b.titulo, cuerpo: b.cuerpo, debrief: b.debrief });
    if (cambios.titulo) g.titulo = String(cambios.titulo).slice(0, 80);
    if (cambios.cuerpo && g.mensaje) g.mensaje.cuerpo = String(cambios.cuerpo).slice(0, 1200);
    if (cambios.debrief) g.debrief = String(cambios.debrief).slice(0, 600);
    if (['aprobado', 'rechazado', 'pendiente'].includes(b.estado)) {
      if (b.estado === 'aprobado') { const err = validarEscenario(g, TACTICAS); if (err.length) throw new HttpError(400, 'No se puede aprobar: ' + err.join(', ')); }
      g.estado = b.estado; g.revisadoPor = u.id; g.revisado = new Date().toISOString();
    }
    store.guardar();
    return g;
  });

  /* ---------------- despachador ---------------- */
  async function servirEstatico(url, res) {
    let ruta = decodeURIComponent(url.pathname);
    if (ruta === '/' || ruta === '/app') { res.writeHead(302, { location: '/app/' }); return res.end(); }
    if (!ruta.startsWith('/app/')) throw new HttpError(404, 'No encontrado');
    ruta = ruta.slice(5) || 'index.html';
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = normalize(join(RAIZ_APP, ruta));
    if (!archivo.startsWith(RAIZ_APP.replace(/[\\/]$/, '') + sep) && archivo !== RAIZ_APP) throw new HttpError(403, 'Prohibido');
    try {
      const st = await stat(archivo); if (!st.isFile()) throw new Error();
      res.writeHead(200, { 'content-type': MIME[extname(archivo)] || 'application/octet-stream', 'cache-control': 'no-cache',
        ...(archivo.endsWith('sw.js') ? { 'service-worker-allowed': '/app/' } : {}) });
      res.end(await readFile(archivo));
    } catch { throw new HttpError(404, 'No encontrado'); }
  }

  return async function manejar(req, res) {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'same-origin');
    res.setHeader('permissions-policy', 'microphone=(self), camera=(self)');
    try {
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Método no permitido');
        return await servirEstatico(url, res);
      }
      const ip = req.socket.remoteAddress || 'x';
      if (!limiteApi(ip)) throw new HttpError(429, 'Demasiadas solicitudes. Intenta en un minuto.');
      for (const r of rutas) {
        if (r.metodo !== req.method) continue;
        const m = url.pathname.match(r.re); if (!m) continue;
        const p = Object.fromEntries(r.claves.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        const u = r.publica ? null : autenticar(req, url);
        const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await leerCuerpo(req) : {};
        const out = await r.fn(req, u, p, body, url, res);
        if (!r.stream || out !== undefined) enviarJSON(res, 200, out);
        return;
      }
      throw new HttpError(404, 'Ruta no encontrada');
    } catch (e) {
      if (res.headersSent) return res.end();
      const status = e.status || 500;
      if (status === 500) console.error(e);
      enviarJSON(res, status, { error: status === 500 ? 'Error interno' : e.message });
    }
  };
}
