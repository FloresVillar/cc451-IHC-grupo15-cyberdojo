// Pruebas de integración del API: login, combates, sincronización offline, salas en tiempo real y privacidad.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { crearStore } from '../src/server/store.js';
import { crearHub } from '../src/server/tiempo-real.js';
import { crearApp } from '../src/server/app.js';
import { crearGateway } from '../src/llm/gateway.js';
import { firmar, verificar } from '../src/server/auth.js';

let srv, base, hub;
before(async () => {
  hub = crearHub();
  const app = crearApp({ env: { RATE_LIMIT: '10000' }, store: crearStore(null), gateway: crearGateway({ LLM_PROVIDER: 'mock' }), hub });
  srv = http.createServer(app);
  await new Promise(r => srv.listen(0, r));
  base = `http://127.0.0.1:${srv.address().port}`;
});
after(() => { hub.cerrar(); srv.close(); });

const api = async (metodo, ruta, token, body) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, datos: await r.json() };
};
const login = async email => (await api('POST', '/api/auth/login', null, { email })).datos.token;

test('JWT: firma, verifica y expira', () => {
  const t = firmar({ sub: 'u1' }, 's'); assert.equal(verificar(t, 's').sub, 'u1');
  assert.equal(verificar(t, 'otro'), null);
  assert.equal(verificar(firmar({ sub: 'u1' }, 's', -1), 's'), null);
});

test('rutas protegidas exigen token', async () => {
  assert.equal((await api('GET', '/api/perfil')).status, 401);
});

test('código de organización inválido devuelve un mensaje claro', async () => {
  const r = await api('POST', '/api/auth/login', null, { email: 'a@b.test', org: 'XYZ' });
  assert.equal(r.status, 404); assert.match(r.datos.error, /TI/);
});

test('combate: el servidor recalcula puntos y actualiza el perfil', async () => {
  const t = await login('nuevo@kallpa.test');
  await api('PATCH', '/api/perfil', t, { rol: 'contador', humor: 2 });
  const r = await api('POST', '/api/combates', t, { idLocal: 'a1', escenarioId: 'E01', accion: 'reportar', inspeccionados: 1, puntos: 99999 });
  assert.equal(r.datos.ok, true);
  assert.ok(r.datos.puntos < 200);
  assert.equal(r.datos.perfil.stats.urgencia.ok, 1);
  assert.equal(r.datos.perfil.equipo, 'Finanzas');
});

test('sincronización offline sin puntos duplicados', async () => {
  const t = await login('offline@kallpa.test');
  const lote = { combates: [{ idLocal: 'z1', escenarioId: 'E12', accion: 'reportar' }, { idLocal: 'z1', escenarioId: 'E12', accion: 'reportar' }] };
  const r = await api('POST', '/api/combates/lote', t, lote);
  assert.equal(r.datos.sincronizados, 1); assert.equal(r.datos.duplicados, 1);
});

test('sala: unirse y recibir el marcador del torneo en vivo por SSE', async () => {
  const tAdmin = await login('javier.huaman@kallpa.test');
  const torneo = (await api('POST', '/api/salas/K4L9PX/torneos', tAdmin, { nombre: 'Prueba', escenarios: ['E12'], duracion_min: 5 })).datos;
  const t = await login('rosa.quispe@kallpa.test');
  const eventos = [];
  const sse = await new Promise(res => http.get(`${base}/api/salas/K4L9PX/eventos?token=${t}`, r => { r.on('data', d => eventos.push(String(d))); res(r); }));
  await api('POST', '/api/combates', t, { escenarioId: 'E12', accion: 'reportar', torneo: { sala: 'K4L9PX', id: torneo.id } });
  await new Promise(r => setTimeout(r, 100));
  sse.destroy();
  const todo = eventos.join('');
  assert.match(todo, /event: sala/);
  assert.match(todo, /event: marcador/);
  assert.match(todo, /Ninja_Contable/); // el alias reemplaza al nombre
});

test('torneo con escenario no aprobado es rechazado (RF18)', async () => {
  const tAdmin = await login('javier.huaman@kallpa.test');
  const r = await api('POST', '/api/salas/K4L9PX/torneos', tAdmin, { escenarios: ['G-DEMO1'] });
  assert.equal(r.status, 400);
  await api('PUT', '/api/admin/escenarios/G-DEMO1', tAdmin, { estado: 'aprobado' });
  assert.equal((await api('POST', '/api/salas/K4L9PX/torneos', tAdmin, { escenarios: ['G-DEMO1'] })).status, 200);
});

test('métricas: solo admin, agregadas y sin emociones individuales', async () => {
  const t = await login('rosa.quispe@kallpa.test');
  assert.equal((await api('GET', '/api/admin/metricas', t)).status, 403);
  const m = (await api('GET', '/api/admin/metricas', await login('javier.huaman@kallpa.test'))).datos;
  assert.ok(m.areas.length >= 3);
  assert.doesNotMatch(JSON.stringify(m), /rosa|u01/i);
});
