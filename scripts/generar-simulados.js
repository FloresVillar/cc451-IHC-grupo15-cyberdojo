// Genera los datos simulados de la demo: 17 colaboradores + 1 admin y 4 semanas de combates.
// Uso: npm run simulados   (es determinista: misma semilla, mismos datos)
// Todas las personas son ficticias. Las fechas se guardan como "dias_atras" y el servidor
// las convierte a fechas reales al crear la base, para que las métricas siempre muestren 4 semanas.
import { readFileSync, writeFileSync } from 'node:fs';
import '../app/js/reglas.js';
const R = globalThis.REGLAS;

const url = p => new URL(p, import.meta.url);
const BANCO = JSON.parse(readFileSync(url('../data/escenarios.json'))).escenarios;

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(2026);
const pick = a => a[Math.floor(rnd() * a.length)];

const ORIGINALES = [
  { id: 'u01', nombre: 'Rosa Quispe', email: 'rosa.quispe@kallpa.test', rol: 'contador', equipo: 'Finanzas', alias: 'Ninja_Contable', useAlias: true, humor: 1, voz: true, subs: true, fs: 1.15 },
  { id: 'u02', nombre: 'Diego Ramírez', email: 'diego.ramirez@kallpa.test', rol: 'desarrollador', equipo: 'TI', humor: 2, voz: true, subs: false, fs: 1 },
  { id: 'u03', nombre: 'Milagros Torres', email: 'milagros.torres@kallpa.test', rol: 'recepcion', equipo: 'Operaciones', humor: 1, voz: false, subs: true, fs: 1 },
];
const NUEVOS = [
  ['Carlos Mamani', 'contador'], ['Lucía Paredes', 'contador'], ['Andrea Flores', 'contador'], ['Jorge Huanca', 'contador'], ['Patricia Rojas', 'contador'],
  ['Kevin Alarcón', 'desarrollador'], ['Sofía Vargas', 'desarrollador'], ['Luis Condori', 'desarrollador'], ['Valeria Chávez', 'desarrollador'], ['Renzo Salazar', 'desarrollador'],
  ['Gabriela Ccahuana', 'recepcion'], ['Miguel Tupac', 'recepcion'], ['Daniela Soto', 'recepcion'], ['Óscar Navarro', 'recepcion'],
];
const EQUIPO = { contador: 'Finanzas', desarrollador: 'TI', recepcion: 'Operaciones' };
const correo = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.') + '@kallpa.test';

const usuarios = [], combates = [];
let cid = 1;
const habilidadBase = { Finanzas: 0.55, TI: 0.62, Operaciones: 0.48 };

function simular(u, guardarPerfil) {
  const perfil = R.perfilVacio({ rol: u.rol, nivel: 1 });
  const base = habilidadBase[u.equipo] + (rnd() - 0.5) * 0.2;
  const n = 6 + Math.floor(rnd() * 8);
  const delRol = BANCO.filter(e => e.rol === u.rol || e.rol === 'todos');
  const emociones = [];
  for (let i = 0; i < n; i++) {
    const dias = Math.round(27 - (i / n) * 26 - rnd() * 2);
    const e = pick(delRol);
    // Aprenden con la práctica: +25 % aprox. entre la semana 1 y la 4. El vishing cuesta más.
    const p = Math.min(0.95, base + (i / n) * 0.28 - (e.canal === 'llamada' ? 0.15 : 0) - (e.dificultad - 2) * 0.05);
    const ok = rnd() < p;
    const accion = e.canal === 'llamada' ? (ok ? pick(['colgar', 'ok']) : 'cayo')
      : ok ? (e.es_ataque ? pick(['reportar', 'reportar', 'verificar']) : 'legitimo') : (e.es_ataque ? 'responder' : 'reportar');
    const { pts } = e.canal === 'llamada' ? R.puntosLlamada(e, accion, 1) : R.puntosMensaje(e, accion, Math.floor(rnd() * 3), 0);
    const c = { id: 'c' + String(cid++).padStart(4, '0'), usuarioId: u.id, equipo: u.equipo, escenarioId: e.id, canal: e.canal,
      tacticas: e.tacticas, es_ataque: e.es_ataque, ok, accion, puntos: pts, ms: 20000 + Math.floor(rnd() * 140000), dias_atras: Math.max(0, dias) };
    combates.push(c);
    if (guardarPerfil) R.aplicarCombate(perfil, { ...c, titulo: e.titulo, fecha: null });
    if (rnd() < 0.35) emociones.push({ dias_atras: Math.max(0, dias), momento: pick(['antes', 'despues']), valor: pick(['con ganas', 'normal', 'normal', 'cansado', 'estresado', 'bien', 'confundido']) });
  }
  return { perfil, emociones };
}

for (const u of ORIGINALES) {
  simular(u, false); // sus perfiles se mantienen como en la PC02; los combates alimentan las métricas
  usuarios.push({ ...u, alias: u.alias || '', useAlias: !!u.useAlias });
}
// Perfiles de la PC02 (se respetan sus puntos y estadísticas)
Object.assign(usuarios[0], { nivel: 1, puntos: 185, stats: { urgencia: { ok: 2, total: 2 }, autoridad: { ok: 1, total: 2 }, adjuntos: { ok: 0, total: 1 }, datos_por_telefono: { ok: 1, total: 1 } }, emociones: [{ dias_atras: 2, momento: 'antes', valor: 'normal' }, { dias_atras: 2, momento: 'despues', valor: 'bien' }] });
Object.assign(usuarios[1], { nivel: 3, puntos: 1120, stats: { enlaces: { ok: 5, total: 6 }, verificacion_remitente: { ok: 3, total: 5 }, datos_por_telefono: { ok: 2, total: 2 } }, emociones: [] });
Object.assign(usuarios[2], { nivel: 2, puntos: 760, stats: { acceso_fisico: { ok: 3, total: 4 }, autoridad: { ok: 2, total: 4 }, datos_por_telefono: { ok: 1, total: 3 } }, emociones: [{ dias_atras: 4, momento: 'antes', valor: 'estresado' }, { dias_atras: 4, momento: 'despues', valor: 'normal' }] });

NUEVOS.forEach(([nombre, rol], i) => {
  const u = { id: 'u' + String(i + 5).padStart(2, '0'), nombre, email: correo(nombre), rol, equipo: EQUIPO[rol], alias: '', useAlias: false,
    humor: Math.floor(rnd() * 3), voz: rnd() < 0.7, subs: rnd() < 0.6, fs: 1 };
  if (i === 5) { u.alias = 'KevinSec'; u.useAlias = true; }
  const { perfil, emociones } = simular(u, true);
  usuarios.push({ ...u, nivel: perfil.nivel, puntos: perfil.puntos, stats: perfil.stats, emociones });
});
usuarios.push({ id: 'u04', nombre: 'Javier Huamán', email: 'javier.huaman@kallpa.test', rol: 'admin', equipo: null, alias: '', useAlias: false });

writeFileSync(url('../data/usuarios.json'), JSON.stringify({
  nota: 'Usuarios simulados (ficticios) generados con scripts/generar-simulados.js. El admin de la demo es javier.huaman@kallpa.test.',
  usuarios }, null, 1) + '\n');
writeFileSync(url('../data/combates-simulados.json'), JSON.stringify({
  nota: 'Historial simulado de 4 semanas para las métricas del administrador. dias_atras se convierte a fecha al crear la base.',
  combates }, null, 1) + '\n');
console.log(`OK: ${usuarios.length} usuarios, ${combates.length} combates simulados`);
