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

Qué requerimiento común de la PC02 se muestra en cada paso y qué código lo implementa (las funciones están en `app/index.html`):

| Paso | Requerimiento PC02 | Qué se ve | Código |
| --- | --- | --- | --- |
| 1 | Diseño emocional: nivel visceral | Estética de dojo y sensei | `senseiSVG()`, `sensei()` |
| 2 | Usabilidad (Nielsen) | Mensaje claro si el código de organización no existe | `doLogin()` |
| 3 | Personalización continua: preferencias | Rol, humor, voz, subtítulos y tamaño de letra guardados en el perfil | `prefs()`, `save()` / `load()` con `localStorage` |
| 4 | Personalización continua: nivel inicial | Calibración de 3 preguntas | `calib()` |
| 5 | Personalización continua: emociones declaradas y errores | Check-in emocional; sugiere las tácticas con acierto < 60% | `checkin()`, `suggested()`, `weakTactics()` |
| 6 | Diseño emocional: nivel conductual (micro-interacciones) | Inspeccionar señales, pistas con costo, puntaje inmediato | `inspect()`, `hint()`, `decide()` |
| 7 | Diseño emocional: tono del asistente y nivel reflexivo | Debrief sin culpa con el humor elegido; nivel y cinturón según el desempeño | `senseiLine()`, `record()`, `belt()` |
| 8 | Interfaz de voz | Llamada con voz sintética, reconocimiento de la respuesta, subtítulos y respuestas escritas | `speak()` (`speechSynthesis`), `listen()` (`SpeechRecognition`), `reply()`, `voiceCmd()` |
| 9 | Multiusuario: salas | Sala, torneo con marcador en vivo (simulado) y tablero con alias | `startTorneo()`, `displayName()` |
| 10 | Multiusuario: administración | Métricas agregadas del equipo y exportación CSV | `csv()` |

Los otros dos requerimientos comunes no tienen pantalla propia:

- **PWA:** `app/manifest.webmanifest` la hace instalable y `app/sw.js` guarda en caché el shell y los escenarios para usarla sin conexión.
- **LLM con capa de abstracción:** el prototipo usa solo el banco de escenarios (`app/escenarios.js`, generado desde `data/escenarios.json` con `npm run datos`). El gateway con proveedores intercambiables, guardrails y fallback está en `src/llm/` y se muestra con `npm run demo:llm`.

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
