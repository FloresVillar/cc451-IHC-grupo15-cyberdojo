// Pruebas de la capa LLM (RNF07, RNF08, RNF10): se prueba el gateway con 2 proveedores distintos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearGateway, BANCO, extraerJSON, evaluarPorReglas } from '../src/llm/gateway.js';
import { sanitizar, validarEscenario } from '../src/llm/guardrails.js';

const plantilla = BANCO.find(e => e.id === 'E04');
const falso = respuesta => ({ fake: { modeloPorDefecto: 'fake-1', async completar() { return typeof respuesta === 'function' ? respuesta() : respuesta; } } });

test('proveedor mock: hace fallback al banco sin romper la experiencia', async () => {
  const gw = crearGateway({ LLM_PROVIDER: 'mock' });
  const e = await gw.generarEscenario({ rol: 'contador', dificultad: 2, tacticasDebiles: ['adjuntos'] });
  assert.equal(e.origen, 'banco');
  assert.equal(e.generado, false);
  assert.ok(e.tacticas.includes('adjuntos'));
});

test('proveedor simulado tipo LLM: el escenario generado pasa por guardrails y validación', async () => {
  const generado = { ...plantilla, id: undefined, titulo: 'Aviso del BCP', mensaje: { ...plantilla.mensaje, cuerpo: 'Entra a https://www.bcp.com.pe/pagar o escribe a cobranzas@bcp.com.pe' } };
  const gw = crearGateway({ LLM_PROVIDER: 'fake' }, { proveedores: falso('```json\n' + JSON.stringify(generado) + '\n```') });
  const e = await gw.generarEscenario({ rol: 'contador', dificultad: 1 });
  assert.equal(e.generado, true);
  assert.equal(e.origen, 'fake');
  assert.match(e.id, /^G/);
  assert.doesNotMatch(JSON.stringify(e), /bcp\.com|\bBCP\b/i);
  assert.match(e.mensaje.cuerpo, /\.test/);
});

test('si el LLM devuelve algo inválido se usa la plantilla del banco', async () => {
  const gw = crearGateway({ LLM_PROVIDER: 'fake' }, { proveedores: falso('{"titulo":"incompleto"}') });
  const e = await gw.generarEscenario({ rol: 'recepcion', dificultad: 1 });
  assert.equal(e.origen, 'banco');
  assert.match(e.motivo, /inválido/);
});

test('timeout: si el LLM tarda más de LLM_TIMEOUT_MS se usa el banco', async () => {
  const lento = { lento: { async completar(_p, _e, signal) { return new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abortado')))); } } };
  const gw = crearGateway({ LLM_PROVIDER: 'lento', LLM_TIMEOUT_MS: '100' }, { proveedores: lento });
  const t0 = Date.now();
  const e = await gw.generarEscenario({ rol: 'contador' });
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(e.motivo, 'timeout');
});

test('proveedor desconocido lanza un error claro', () => {
  assert.throws(() => crearGateway({ LLM_PROVIDER: 'nada' }), /desconocido/);
});

test('guardrails: reescribe enlaces, correos y marcas reales', () => {
  const s = sanitizar({ t: 'Paga en https://interbank.pe/x, por Yape o a pagos@empresa.com' });
  assert.equal(s.t, 'Paga en https://bancointi.test/x, por BilleteraYa o a pagos@empresa.test');
});

test('validarEscenario detecta estructura incompleta', () => {
  assert.deepEqual(validarEscenario(plantilla, ['autoridad', 'adjuntos']), []);
  assert.ok(validarEscenario({ titulo: 'x', canal: 'fax' }, []).includes('canal'));
});

test('evaluación por reglas de respuestas habladas', () => {
  const e3 = BANCO.find(e => e.id === 'E03');
  assert.equal(evaluarPorReglas(e3, 'Ya, ahí le doy el código').seguro, false);
  assert.equal(evaluarPorReglas(e3, 'No comparto códigos, voy a colgar').seguro, true);
  assert.equal(evaluarPorReglas(e3, '¿de qué área me dijo?').decidido, false);
});

test('el sensei responde aunque no haya LLM', async () => {
  const gw = crearGateway({ LLM_PROVIDER: 'mock' });
  const r = await gw.conversar({ pregunta: '¿Qué hago con una memoria USB que encontré?' });
  assert.equal(r.origen, 'reglas');
  assert.match(r.respuesta, /TI/);
});

test('extraerJSON tolera texto alrededor', () => {
  assert.deepEqual(extraerJSON('Claro: {"a":1} listo'), { a: 1 });
});

test('guardrails: dominios con varios niveles conservan el nombre', () => {
  assert.equal(sanitizar('https://www.bcp.com.pe/login'), 'https://www.bancoandino.test/login');
  assert.equal(sanitizar('mesa@soporte.kallpa.com.pe'), 'mesa@soporte.kallpa.test');
});

test('groq usa la API compatible con OpenAI con su URL, key y modelo', async () => {
  const original = globalThis.fetch;
  let pedido;
  globalThis.fetch = async (url, op) => { pedido = { url, op }; return new Response(JSON.stringify({ choices: [{ message: { content: 'hola' } }] }), { status: 200 }); };
  try {
    const gw = crearGateway({ LLM_PROVIDER: 'groq', GROQ_API_KEY: 'gsk_x' });
    const r = await gw.conversar({ pregunta: 'hola' });
    assert.equal(r.origen, 'groq');
    assert.equal(pedido.url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(pedido.op.headers.authorization, 'Bearer gsk_x');
    assert.equal(JSON.parse(pedido.op.body).model, 'llama-3.3-70b-versatile');
  } finally { globalThis.fetch = original; }
});
