// RNF07: todo enlace o correo que genere el LLM se reescribe a un dominio .test no funcional.
const URL_RE = /\bhttps?:\/\/([a-z0-9.-]+)(\/[^\s"]*)?/gi;
const MAIL_RE = /\b([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})\b/gi;
const aTest = d => (d.endsWith('.test') ? d : d.replace(/\.[a-z.]+$/i, '') + '.test');

export function sanitizar(obj) {
  const limpiar = s => s.replace(URL_RE, (_, d, p = '') => `https://${aTest(d)}${p}`)
                        .replace(MAIL_RE, (_, u, d) => `${u}@${aTest(d)}`);
  return JSON.parse(limpiar(JSON.stringify(obj)));
}
