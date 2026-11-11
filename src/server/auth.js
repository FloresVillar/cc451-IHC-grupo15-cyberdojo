// JWT HS256 mínimo con node:crypto (RNF06: tokens con expiración de 1 h, sin dependencias).
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

export function firmar(payload, secreto, segundos = 3600) {
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ ...payload, iat: ahora, exp: ahora + segundos })}`;
  return `${cuerpo}.${createHmac('sha256', secreto).update(cuerpo).digest('base64url')}`;
}

export function verificar(token, secreto) {
  if (!token || token.split('.').length !== 3) return null;
  const [h, p, firma] = token.split('.');
  const esperada = createHmac('sha256', secreto).update(`${h}.${p}`).digest();
  const recibida = Buffer.from(firma, 'base64url');
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const datos = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (!datos.exp || datos.exp < Math.floor(Date.now() / 1000)) return null;
    return datos;
  } catch { return null; }
}
