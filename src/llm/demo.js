// npm run demo:llm  -> muestra qué escenario recibiría Rosa (contadora) según su perfil.
import { crearGateway } from './gateway.js';
import { sanitizar } from './guardrails.js';
const gw = crearGateway();
const esc = await gw.generarEscenario({ rol: 'contador', dificultad: 2, tacticasDebiles: ['adjuntos'] });
console.log(`Proveedor: ${gw.proveedor} · origen: ${esc.origen}`);
console.log(`${esc.id} - ${esc.titulo} (${esc.canal})`);
console.log('Guardrail:', sanitizar({ url: 'Ingresa a https://banco-real.com.pe/login o escribe a soporte@empresa.com' }).url);
