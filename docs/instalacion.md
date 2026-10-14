# Guía de instalación

## Requisitos

- Node.js 18 o superior (solo para el servidor local y la demo del LLM).
- Navegador: Chrome o Edge (recomendado para voz). Firefox y Safari funcionan, pero el reconocimiento de voz puede no estar disponible; en ese caso se responde escribiendo.
- Laptop convencional (4 GB RAM) o celular Android/iOS.

## 1. Clonar

```bash
git clone https://github.com/FloresVillar/cc451-IHC-grupo15-cyberdojo.git
cd cc451-IHC-grupo15-cyberdojo
git checkout dev
```

Si ya lo tienes clonado, actualiza antes de ejecutar:

```bash
git checkout dev
git pull origin dev
```

## 2. Levantar el prototipo

```bash
npm start
```

`npm start` levanta un servidor web local en el puerto 8080 con `http-server` (vía `npx`, sin `npm install`). Hace falta porque el service worker de la PWA no funciona abriendo el archivo directamente.

Abre `http://localhost:8080/app/` en Chrome o Edge. Para detener el servidor, `Ctrl + C` en la terminal.

En WSL se ejecuta `npm start` desde la terminal de Linux y la URL se abre en el navegador de Windows; `localhost` funciona igual.

### Recorrido de la demo

1. P01 Bienvenida: **Empezar**.
2. P02 Ingreso: cualquier correo o código y **Continuar**.
3. P03 Rol y preferencias: elegir rol, humor y voz; **Siguiente** y **Entrar al dojo**.
4. P04 Calibración: responder las 3 preguntas o **Saltar calibración**.
5. P05 Dojo: elegir un emoji del check-in y **Empezar combate**.
6. P07 Combate de correo: tocar el remitente y **Ver enlace**, pedir **Pista** si se quiere y **Reportar**.
7. P09 Debrief: **Escuchar al sensei** y **Siguiente combate**.
8. P08 Llamada de vishing: contestar y responder por voz (permitir el micrófono) o con la frase "No comparto códigos por teléfono, voy a colgar.".
9. Desde el Dojo: **Salas y torneos** → **Unirme** → **Entrar al torneo** → **Tablero de cinturones**.
10. **Soy administrador**: crear torneo, aprobar escenarios y exportar CSV.

Cada paso recorre la trazabilidad de la [matriz](05-matriz-trazabilidad.md): requerimiento ([03](03-requerimientos.md)) → historia de usuario ([04](04-historias-usuario.md)) → pantalla, junto con el [criterio de usabilidad](07-criterios-usabilidad.md) que se comprueba y el requerimiento común de la PC02 que cubre. Las funciones están en `app/index.html`.

| Paso | Requerimiento → HU | Criterio de usabilidad / usuario | PC02 | Código |
| --- | --- | --- | --- | --- |
| 1 P01 | RF02 → HU02 | Facilidad de aprendizaje: primer combate en < 5 min sin tutorial | Diseño emocional visceral | `senseiSVG()`, `sensei()` |
| 2 P02 | RF01, RNF06 → HU01 | Prevención de errores: código inválido con mensaje claro y sugerencia | Usabilidad | `doLogin()` |
| 3 P03 | RF01, RF02, RNF02 → HU01, HU09, HU16 | Accesibilidad: tamaño de letra y subtítulos (Rosa); alias para no exponerse | Personalización continua | `prefs()`, `save()` / `load()` |
| 4 P04 | RF02, RF10 → HU02 | Facilidad de aprendizaje: nivel inicial según experiencia (Diego vs. Rosa) | Personalización continua | `calib()` |
| 5 P05 | RF10, RF11 → HU10, HU11 | Eficiencia: máximo 2 toques hasta un combate; recuperación emocional | Personalización continua | `checkin()`, `suggested()`, `weakTactics()` |
| 6 P07 | RF05, RF08, RF20 → HU04, HU05, HU21 | Prevención de errores (confirmación en acciones riesgosas); consistencia: barra de acciones fija | Diseño emocional conductual | `inspect()`, `hint()`, `decide()` |
| 7 P09 | RF09, RF12, RNF12 → HU08, HU09, HU12 | Recuperación emocional: ≥ 80% inicia otro combate tras fallar; tono sin culpa | Diseño emocional reflexivo | `senseiLine()`, `record()`, `belt()` |
| 8 P08 | RF06, RF07, RF19, RNF03 → HU06, HU07, HU20 | Accesibilidad sin audio (subtítulos y texto); visibilidad del estado del micrófono; entorno ruidoso (Milagros) | Interfaz de voz | `speak()`, `listen()`, `reply()`, `voiceCmd()` |
| 9 P11–P13 | RF14, RF15, RF16, RNF09 → HU14, HU15, HU16 | Satisfacción; nunca se publican errores individuales (actitud frente al error) | Multiusuario | `startTorneo()`, `displayName()` |
| 10 P15 | RF17, RF18, RF22 → HU17, HU18, HU19 | Stakeholder responsable de TI (Javier): métricas claras y agregadas | Multiusuario | `csv()` |

Los otros dos requerimientos comunes no tienen pantalla propia:

- **PWA (RF21, RNF04 → HU22):** `app/manifest.webmanifest` la hace instalable y `app/sw.js` guarda en caché el shell y los escenarios para usarla sin conexión.
- **LLM con capa de abstracción (RF03, RF04, RNF07, RNF10 → HU03, HU23):** el prototipo usa solo el banco de escenarios (`app/escenarios.js`, generado desde `data/escenarios.json` con `npm run datos`). El gateway con proveedores intercambiables, guardrails y fallback está en `src/llm/` y se muestra con `npm run demo:llm`.

La barra superior salta a cualquier pantalla (P01–P15) y **Reiniciar demo** vuelve todo al inicio. También se puede ir directo a una pantalla con `http://localhost:8080/app/#P08`.


### Publicar en GitHub Pages

Settings → Pages → Branch `main`, carpeta `/ (root)`. El prototipo quedará en `https://<usuario>.github.io/cyberdojo/app/`.

## 3. Capa LLM (opcional en esta etapa)

```bash
cp .env.example .env
# editar LLM_PROVIDER: mock | anthropic | openai | ollama
npm run demo:llm
```

Con `mock` no se necesita API key: el gateway usa el banco de escenarios (mismo comportamiento que el fallback). Para un modelo local:

```bash
# instalar Ollama y luego
ollama pull llama3.1
LLM_PROVIDER=ollama LLM_MODEL=llama3.1 npm run demo:llm
```

## 4. Editar escenarios

Los escenarios están en `data/escenarios.json`. Después de editarlos:

```bash
npm run datos   # regenera app/escenarios.js
```

## 5. Regenerar diagramas

```bash
dot -Tpng docs/diagramas/interacciones.dot -o docs/img/interacciones.png
dot -Tpng docs/diagramas/c4-contexto.dot -o docs/img/c4-contexto.png
dot -Tpng docs/diagramas/c4-contenedores.dot -o docs/img/c4-contenedores.png
python docs/diagramas/gantt.py
```

## Problemas comunes

| Problema | Solución |
|---|---|
| La llamada no suena | Revisar que "Usar voz" esté activo en Ajustes y que el volumen del navegador no esté silenciado. |
| El micrófono no responde | Dar permiso de micrófono; en móvil se necesita HTTPS. Mientras tanto, usar las respuestas rápidas o el campo de texto. |
| Quiero empezar de cero | Botón "Reiniciar demo" en la barra superior. |
