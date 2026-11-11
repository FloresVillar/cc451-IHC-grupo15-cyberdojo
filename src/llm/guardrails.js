// Guardrails de salida del LLM (RNF07).
// 1. Todo enlace o correo se reescribe a un dominio .test, que nunca resuelve.
// 2. Las marcas reales se reemplazan por marcas ficticias del universo CyberDojo.
// 3. Se rechazan textos con instrucciones técnicas peligrosas.
const URL_RE = /\bhttps?:\/\/([a-z0-9.-]+)(\/[^\s"\\]*)?/gi;
const MAIL_RE = /\b([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})\b/gi;
const DOMINIO_SUELTO_RE = /\b(www\.[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|pe|net|org|io|app|info|xyz)(?:\.pe)?)\b/gi;
const TLD_RE = /(\.(com|net|org|gob|edu|mil|io|app|info|xyz|co|biz|online|site|pe|es|mx|ar|cl|us))+$/i;
const aTest = d => {
  if (d.toLowerCase().endsWith('.test')) return d;
  const sinTld = TLD_RE.test(d) ? d.replace(TLD_RE, '') : d.replace(/\.[a-z]+$/i, '');
  return (sinTld || 'ejemplo') + '.test';
};

export const MARCAS = {
  'BCP': 'Banco Andino', 'Banco de Crédito': 'Banco Andino', 'Interbank': 'Banco Inti', 'BBVA': 'Banco Pacífico',
  'Scotiabank': 'Banco Costa', 'Banco de la Nación': 'Banco Nacional Andino', 'SUNAT': 'Recaudación Tributaria Nacional',
  'RENIEC': 'Registro Nacional de Identidad', 'Yape': 'BilleteraYa', 'Plin': 'PagoYa', 'Microsoft': 'Microsys',
  'Office 365': 'Suite Oficina', 'Outlook': 'Correo Corporativo', 'Google': 'Buscalia', 'Gmail': 'Correo Buscalia',
  'WhatsApp': 'MensaChat', 'Facebook': 'RedSocial', 'Instagram': 'FotoRed', 'Amazon': 'MercaRed', 'Netflix': 'StreamFlix',
  'PayPal': 'PagoSeguro', 'Apple': 'Manzana Tech', 'DHL': 'Courier Rápido', 'Olva': 'Courier Andino', 'Serpost': 'Correo Nacional',
  'GitHub': 'CodeHub', 'npm': 'paquetería JS', 'Slack': 'ChatEquipo', 'Zoom': 'VideoSala', 'Teams': 'SalaEquipo',
};
const MARCAS_RE = new RegExp(`\\b(${Object.keys(MARCAS).sort((a, b) => b.length - a.length).map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
const MARCA_DE = Object.fromEntries(Object.entries(MARCAS).map(([k, v]) => [k.toLowerCase(), v]));

const PELIGROSO = [/powershell\s+-/i, /curl\s+[^|]+\|\s*(ba)?sh/i, /\bmimikatz\b/i, /\bmacro\s+vba\b/i, /\bkeylogger\b/i, /\bransomware\b.*\b(c[oó]digo|script)\b/i];

const slug = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const MARCAS_DOMINIO_RE = new RegExp(`(${Object.keys(MARCAS).map(slug).sort((a, b) => b.length - a.length).join('|')})`, 'gi');
const SLUG_DE = Object.fromEntries(Object.entries(MARCAS).map(([k, v]) => [slug(k), slug(v)]));
// En dominios la marca real también se cambia: www.bcp.com.pe -> www.bancoandino.test
const dominioSeguro = d => aTest(d).replace(MARCAS_DOMINIO_RE, m => SLUG_DE[m.toLowerCase()] || m);

export function limpiarTexto(s) {
  const guardados = [];
  const guardar = t => `\u0000${guardados.push(t) - 1}\u0000`;
  const conMarcador = s
    .replace(URL_RE, (_, d, p = '') => guardar(`https://${dominioSeguro(d)}${p}`))
    .replace(MAIL_RE, (_, u, d) => guardar(`${u}@${dominioSeguro(d)}`))
    .replace(DOMINIO_SUELTO_RE, d => guardar(dominioSeguro(d)));
  return conMarcador
    .replace(MARCAS_RE, m => MARCA_DE[m.toLowerCase()] || m)
    .replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[Number(i)]);
}

export function esPeligroso(texto) {
  return PELIGROSO.some(re => re.test(texto));
}

/** Limpia recursivamente cualquier objeto o texto generado. */
export function sanitizar(obj) {
  if (typeof obj === 'string') return limpiarTexto(obj);
  if (Array.isArray(obj)) return obj.map(sanitizar);
  if (obj && typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitizar(v)]));
  return obj;
}

const CANALES = ['correo', 'chat', 'sms', 'llamada', 'presencial'];

/** Valida que un escenario generado tenga la estructura que la PWA sabe mostrar. */
export function validarEscenario(e, tacticasValidas) {
  const err = [];
  if (!e || typeof e !== 'object') return ['no es un objeto'];
  if (!e.titulo || typeof e.titulo !== 'string') err.push('titulo');
  if (!CANALES.includes(e.canal)) err.push('canal');
  if (![1, 2, 3].includes(Number(e.dificultad))) err.push('dificultad');
  if (!Array.isArray(e.tacticas) || !e.tacticas.length || e.tacticas.some(t => !tacticasValidas.includes(t))) err.push('tacticas');
  if (typeof e.es_ataque !== 'boolean') err.push('es_ataque');
  if (!Array.isArray(e.senales) || !e.senales.length) err.push('senales');
  if (!e.debrief) err.push('debrief');
  if (e.canal === 'llamada') {
    if (!Array.isArray(e.guion) || e.guion.length < 2) err.push('guion');
    if (!Array.isArray(e.palabras_clave_correctas)) err.push('palabras_clave_correctas');
  } else {
    const m = e.mensaje;
    if (!m || !m.de || !m.cuerpo) err.push('mensaje');
    else { m.enlaces = m.enlaces || []; m.adjuntos = m.adjuntos || []; m.asunto = m.asunto || ''; }
  }
  if (esPeligroso(JSON.stringify(e))) err.push('contenido peligroso');
  return err;
}
