// Pruebas de las reglas de personalización compartidas por cliente y servidor (RF08, RF10, RF12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../app/js/reglas.js';
import { BANCO } from '../src/llm/gateway.js';
const R = globalThis.REGLAS;
const e = id => BANCO.find(x => x.id === id);

test('cinturones según puntos', () => {
  assert.equal(R.CINTURONES[R.cinturon(0)].n, 'Blanco');
  assert.equal(R.CINTURONES[R.cinturon(260)].n, 'Naranja');
  assert.equal(R.CINTURONES[R.cinturon(5000)].n, 'Negro');
});

test('3 aciertos seguidos suben el nivel y 2 errores lo bajan', () => {
  const p = R.perfilVacio({ nivel: 1 });
  for (let i = 0; i < 3; i++) R.aplicarCombate(p, { escenarioId: 'E01', tacticas: ['urgencia'], ok: true, puntos: 50 });
  assert.equal(p.nivel, 2);
  R.aplicarCombate(p, { escenarioId: 'E02', tacticas: ['adjuntos'], ok: false, puntos: 10 });
  R.aplicarCombate(p, { escenarioId: 'E04', tacticas: ['adjuntos'], ok: false, puntos: 10 });
  assert.equal(p.nivel, 1);
  assert.deepEqual(R.tacticasDebiles(p), ['adjuntos']);
});

test('la sugerencia prioriza la táctica débil del rol', () => {
  const p = R.perfilVacio({ rol: 'contador', stats: { adjuntos: { ok: 0, total: 3 } } });
  assert.ok(R.sugerir(p, BANCO).tacticas.includes('adjuntos'));
});

test('emoción "estresado" activa modo práctica y baja el humor', () => {
  const p = R.perfilVacio({ humor: 2, emociones: [{ valor: 'estresado' }] });
  const t = R.tonoSensei(p);
  assert.equal(t.modoPractica, true);
  assert.equal(t.humor, 1);
});

test('puntos: reportar un ataque suma más que caer, y caer igual suma algo', () => {
  assert.equal(R.puntosMensaje(e('E01'), 'reportar', 2, 0).ok, true);
  const caer = R.puntosMensaje(e('E01'), 'responder', 0, 0);
  assert.equal(caer.ok, false); assert.equal(caer.pts, 10);
  assert.equal(R.puntosLlamada(e('E03'), 'cayo', 1).ok, false);
});

test('logros y frases sin culpa', () => {
  const p = R.perfilVacio();
  const r = R.aplicarCombate(p, { escenarioId: 'E01', tacticas: ['urgencia'], ok: true, puntos: 80, accion: 'reportar' });
  assert.deepEqual(r.logrosNuevos, ['primer_combate', 'primer_reporte']);
  for (const h of [0, 1, 2]) assert.doesNotMatch(R.fraseSensei(false, h), /fallaste|error grave/i);
});
