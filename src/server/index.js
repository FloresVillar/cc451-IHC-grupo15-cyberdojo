// Punto de entrada: npm start  ->  http://localhost:8080/app/
import http from 'node:http';
import https from 'node:https';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { cargarEnv } from './env.js';
import { crearStore } from './store.js';
import { crearHub } from './tiempo-real.js';
import { crearApp, estadoTorneo } from './app.js';
import { crearGateway } from '../llm/gateway.js';

const hayEnv = cargarEnv();
const env = process.env;
const PUERTO = Number(env.PORT || 8080);
const archivoDB = env.DB_FILE || fileURLToPath(new URL('../../data/runtime/db.json', import.meta.url));

const store = crearStore(archivoDB);
const gateway = crearGateway(env);
const hub = crearHub();
const manejar = crearApp({ env, store, gateway, hub });

// Modo demo: el torneo de ejemplo arranca al iniciar el servidor y los otros equipos
// suman puntos simulados, para que el marcador se mueva aunque se pruebe con una sola persona.
const DEMO = env.DEMO !== '0';
if (DEMO) {
  for (const s of store.db.salas) for (const t of s.torneos) {
    if (t.id === 'T01' && estadoTorneo(t).estado !== 'en_curso') {
      t.inicio = new Date().toISOString(); t.duracion_min = 30;
      t.marcador = Object.fromEntries(s.equipos.map(e => [e.nombre, 0]));
    }
  }
  store.guardar();
  setInterval(() => {
    for (const s of store.db.salas) for (const t of s.torneos) {
      if (estadoTorneo(t).estado !== 'en_curso' || Math.random() < 0.4) continue;
      const eq = s.equipos[Math.floor(Math.random() * s.equipos.length)];
      const pts = [10, 20, 40, 60][Math.floor(Math.random() * 4)];
      t.marcador[eq.nombre] = (t.marcador[eq.nombre] || 0) + pts;
      eq.puntos += pts;
      hub.emitir(s.codigo, 'marcador', { torneo: t.id, marcador: t.marcador, ultimo: { equipo: eq.nombre, puntos: pts, quien: 'compañero (simulado)' } });
    }
    store.guardar();
  }, 7000).unref();
}

const servidor = env.HTTPS_CERT && env.HTTPS_KEY
  ? https.createServer({ cert: readFileSync(env.HTTPS_CERT), key: readFileSync(env.HTTPS_KEY) }, manejar)
  : http.createServer(manejar);
const esquema = env.HTTPS_CERT ? 'https' : 'http';

servidor.listen(PUERTO, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log(`\n  CyberDojo v0.3 listo`);
  console.log(`  ➜ En esta laptop:   ${esquema}://localhost:${PUERTO}/app/`);
  for (const ip of ips) console.log(`  ➜ En tu celular:    ${esquema}://${ip}:${PUERTO}/app/  (misma red Wi-Fi)`);
  console.log(`  Archivo .env: ${hayEnv ? 'cargado' : 'no encontrado (se usa la configuración por defecto)'}`);
  console.log(`  LLM: ${gateway.proveedor}${gateway.proveedor === 'mock' ? ' (sin IA: banco de escenarios y reglas; configura .env para usar un LLM)' : ' · modelo ' + gateway.modelo}`);
  console.log(`  Base de datos: ${archivoDB}`);
  console.log(`  Admin de la demo: javier.huaman@kallpa.test · Modo demo: ${DEMO ? 'sí' : 'no'}\n`);
});

function apagar() { store.guardarYa(); hub.cerrar(); servidor.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500).unref(); }
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
