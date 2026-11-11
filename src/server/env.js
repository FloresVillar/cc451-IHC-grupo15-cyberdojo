// Carga .env sin dependencias (KEY=valor por línea). Las variables ya definidas en el entorno ganan.
import { readFileSync, existsSync } from 'node:fs';

export function cargarEnv(ruta = new URL('../../.env', import.meta.url)) {
  if (!existsSync(ruta)) {
    if (existsSync(new URL('../../.env.txt', import.meta.url))) console.warn('\n  ⚠ Encontré ".env.txt" pero no ".env". Renómbralo a .env (Windows oculta la extensión .txt).');
    return false;
  }
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || linea.trim().startsWith('#')) continue;
    const valor = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = valor;
  }
  return true;
}
