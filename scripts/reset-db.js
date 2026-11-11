// Borra la base local (data/runtime/db.json) para volver a los datos simulados iniciales.
import { rmSync } from 'node:fs';
rmSync(new URL('../data/runtime/', import.meta.url), { recursive: true, force: true });
console.log('Base reiniciada: al iniciar el servidor se vuelve a crear con los datos simulados.');
