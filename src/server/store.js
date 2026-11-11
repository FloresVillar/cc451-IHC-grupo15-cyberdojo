// Persistencia en un archivo JSON (data/runtime/db.json). Se crea a partir de los datos simulados
// la primera vez. La escritura es atómica (archivo temporal + rename) y agrupada cada 200 ms.
// Para producción se reemplaza por PostgreSQL detrás de la misma interfaz (ver arquitectura C4).
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import '../../app/js/reglas.js';
const R = globalThis.REGLAS;

const leer = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const fecha = dias => new Date(Date.now() - dias * 864e5).toISOString();

export function semilla() {
  const usuarios = leer('../../data/usuarios.json').usuarios.map(u => {
    const p = R.perfilVacio({ ...u, esAdmin: u.rol === 'admin', calibrado: true });
    p.emociones = (u.emociones || []).map(e => ({ fecha: fecha(e.dias_atras ?? 0), momento: e.momento, valor: e.valor }));
    p.salas = u.rol === 'admin' || u.equipo ? ['K4L9PX'] : [];
    return p;
  });
  const combates = leer('../../data/combates-simulados.json').combates.map(({ dias_atras, ...c }) => ({ ...c, fecha: fecha(dias_atras), simulado: true }));
  const salasJSON = leer('../../data/salas.json');
  const salas = salasJSON.salas.map(s => ({
    ...s,
    equipos: s.equipos.map(e => ({ ...e, miembros: usuarios.filter(u => u.equipo === e.nombre).map(u => u.id) })),
    torneos: s.torneos.map(t => ({ ...t, marcador: Object.fromEntries(s.equipos.map(e => [e.nombre, 0])) })),
  }));
  const generados = leer('../../data/escenarios-generados.json').generados;
  return { version: 3, meta: { jwtSecret: randomBytes(32).toString('hex'), creado: new Date().toISOString() }, usuarios, combates, salas, generados };
}

export function crearStore(archivo = null) {
  let db;
  if (archivo && existsSync(archivo)) {
    try { db = JSON.parse(readFileSync(archivo, 'utf8')); } catch { db = null; }
  }
  if (!db || db.version !== 3) db = semilla();
  let pendiente = null;

  function guardarYa() {
    if (!archivo) return;
    mkdirSync(dirname(archivo), { recursive: true });
    const tmp = archivo + '.tmp';
    writeFileSync(tmp, JSON.stringify(db));
    renameSync(tmp, archivo);
  }
  function guardar() {
    if (!archivo || pendiente) return;
    pendiente = setTimeout(() => { pendiente = null; guardarYa(); }, 200);
  }
  guardarYa();

  return {
    db,
    guardar,
    guardarYa,
    usuarioPorId: id => db.usuarios.find(u => u.id === id),
    usuarioPorEmail: email => db.usuarios.find(u => u.email.toLowerCase() === String(email).toLowerCase()),
    sala: codigo => db.salas.find(s => s.codigo === String(codigo).toUpperCase()),
    crearUsuario(datos) {
      const id = 'u' + randomBytes(4).toString('hex');
      const u = R.perfilVacio({ id, rol: 'otro', calibrado: false, salas: [], esAdmin: false, ...datos });
      db.usuarios.push(u); guardar();
      return u;
    },
  };
}
