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

Qué concepto se muestra en cada paso y qué código lo implementa (las funciones están en `app/index.html`):

| Paso | Concepto | Código |
| --- | --- | --- |
| 1 | Diseño emocional visceral (Norman): estética de dojo y sensei | `senseiSVG()`, `sensei()` |
| 2 | Prevención y recuperación de errores (Nielsen): mensaje claro si el código no existe (RF01) | `doLogin()` |
| 3 | Personalización continua y accesibilidad: rol, humor, voz, subtítulos y tamaño de letra en un perfil persistente (RF02, RF10) | `prefs()`, `save()` / `load()` con `localStorage` |
| 4 | Calibración del nivel inicial (HU02) | `calib()` |
| 5 | Check-in emocional (RF11) y dificultad adaptativa: sugiere tácticas con acierto < 60% (HU10) | `checkin()`, `suggested()`, `weakTactics()` |
| 6 | Visibilidad de las señales de alerta, pistas con costo y puntaje (RF05, RF08, RF20) | `inspect()`, `hint()`, `decide()`; escenarios en `app/escenarios.js` |
| 7 | Debrief sin culpa con el humor elegido (RNF12) y progreso: 3 aciertos suben de nivel, 2 errores bajan, cinturones por puntos | `senseiLine()`, `record()`, `belt()` |
| 8 | Interfaz de voz no convencional: TTS y reconocimiento de voz con subtítulos y respuestas escritas como alternativa (RF06, RF07) | `speak()` (`speechSynthesis`), `listen()` (`SpeechRecognition`), `reply()`, `voiceCmd()` |
| 9 | Multiusuario: sala, torneo con marcador en vivo (simulado con temporizador) y tablero con alias (RF14–RF16) | `startTorneo()`, `displayName()` |
| 10 | Panel del responsable de TI con métricas agregadas y exportación (RF17, RF22) | `csv()` |

Fuera de las pantallas:

- **PWA y modo sin conexión (RF21):** `app/sw.js` guarda en caché el shell y los escenarios; `app/manifest.webmanifest` permite instalarla.
- **Datos simulados:** `app/escenarios.js` se genera desde `data/escenarios.json` con `npm run datos` (`scripts/build-datos.js`).
- **Capa LLM (RF04, RNF07, RNF10):** el prototipo usa solo el banco de escenarios. El gateway con proveedores, guardrails y fallback está en `src/llm/` y se muestra con `npm run demo:llm`.

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
