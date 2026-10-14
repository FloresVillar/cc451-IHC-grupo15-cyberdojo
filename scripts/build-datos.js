// Regenera app/escenarios.js a partir de data/escenarios.json
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../data/escenarios.json', import.meta.url)));
writeFileSync(new URL('../app/escenarios.js', import.meta.url),
  '// Generado desde data/escenarios.json (npm run datos)\nwindow.ESCENARIOS = ' + JSON.stringify(d, null, 1) + ';\n');
console.log(`OK: ${d.escenarios.length} escenarios`);
