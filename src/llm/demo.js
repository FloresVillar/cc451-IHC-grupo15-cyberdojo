// npm run demo:llm  -> muestra la capa LLM funcionando con el proveedor configurado en .env
import { cargarEnv } from '../server/env.js';
import { crearGateway, BANCO } from './gateway.js';
import { sanitizar } from './guardrails.js';

cargarEnv();
const gw = crearGateway();
console.log(`Proveedor: ${gw.proveedor} · modelo: ${gw.modelo}\n`);

const esc = await gw.generarEscenario({ rol: 'contador', dificultad: 2, tacticasDebiles: ['adjuntos'] });
console.log(`1) Escenario para Rosa (contadora, débil en adjuntos) · origen: ${esc.origen}${esc.motivo ? ` (${esc.motivo})` : ''}`);
console.log(`   ${esc.id} - ${esc.titulo} (${esc.canal})\n`);

const llamada = BANCO.find(e => e.id === 'E03');
for (const r of ['Ya, ahí le doy el código', 'No comparto códigos, voy a llamar al número oficial', 'Mmm, ¿de qué área me dijo?']) {
  const ev = await gw.evaluarRespuesta({ escenario: llamada, respuesta: r });
  console.log(`2) "${r}" -> seguro=${ev.seguro} decidido=${ev.decidido} (${ev.origen})`);
}

const s = await gw.conversar({ pregunta: '¿Cómo reconozco una llamada falsa del banco?', perfil: { rol: 'contador' } });
console.log(`\n3) Sensei (${s.origen}): ${s.respuesta}`);

console.log('\n4) Guardrail:', sanitizar('Ingresa a https://www.bcp.com.pe/login o escribe a soporte@empresa.com por Yape'));
console.log('\nEstadísticas:', gw.estadisticas());
