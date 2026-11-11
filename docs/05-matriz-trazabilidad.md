# Matriz de trazabilidad (actualizada a la PC03)

Estados: **Implementado** = funciona en el prototipo v0.3 con servidor y datos simulados; **Parcial** = funciona con una limitación indicada; **Pendiente** = planificado para la entrega final. Las pantallas se identifican como P01–P16 (lista al final). Las capturas están en [`img/pc03/`](img/pc03/) y las pruebas automáticas en [`../test/`](../test/) (`npm test`, 26 pruebas).

| ID Req | Descripción | Tipo | Prioridad | HU | Estado PC02 | **Estado PC03** | Criterio de aceptación | Evidencia (código · pantalla · prueba) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RF01 | Registro/ingreso con rol | FR | Alta | HU01 | Prototipo | **Implementado** | Cuenta con correo o código válido; rol guardado y editable. | [`app.js` POST /api/auth/login, PATCH /api/perfil](../src/server/app.js) · P02, P03 · `api.test.js` "código de organización inválido" |
| RF02 | Onboarding con calibración y preferencias | FR | Alta | HU02 | Prototipo | **Implementado** | 3 preguntas; nivel inicial; opción de saltar. | [`app/js/app.js` R.P04](../app/js/app.js) · P03, P04 · captura `P04-calibracion.png` |
| RF03 | Escenarios generados por LLM según rol y dificultad | FR | Alta | HU03 | Diseñado | **Implementado** | Prompt con rol, dificultad y tácticas débiles; fallback al banco si falla o supera `LLM_TIMEOUT_MS`. | [`gateway.js` generarEscenario](../src/llm/gateway.js), GET /api/escenarios/siguiente?ia=1 · P05 "Combate generado por IA" · `llm.test.js` (4 pruebas) |
| RF04 | Capa de abstracción del proveedor LLM | FR | Alta | HU23 | Diseñado | **Implementado** | Cambio de proveedor solo con `.env`. | [`providers.js`](../src/llm/providers.js): anthropic, openai (y compatibles), gemini, ollama, mock |
| RF05 | Correo/SMS/chat inspeccionable con 4 acciones | FR | Alta | HU04, HU05 | Prototipo | **Implementado** | Enlaces muestran URL sin navegar; 4 acciones; confirmación en la acción riesgosa. | [`app.js` R.P07, confirmarRiesgo](../app/js/app.js) · P07 |
| RF06 | Llamada de vishing por voz multiturno | FR | Alta | HU06 | Prototipo | **Implementado** | Timbre, TTS del atacante, micrófono automático al terminar cada turno, máx. 3 turnos, evaluación (reglas + LLM). | [`voz.js`](../app/js/voz.js), [`app.js` answer/talk/reply](../app/js/app.js), POST /api/evaluar · P08 |
| RF07 | Subtítulos y respuesta escrita en llamadas | FR | Alta | HU07 | Prototipo | **Implementado** | Subtítulos, transcripción en vivo, respuestas rápidas y campo de texto. | P08 · captura `P08-llamada-turno.png` |
| RF08 | Evaluación de decisión y señales | FR | Alta | HU05, HU06 | Prototipo | **Implementado** | El servidor recalcula el puntaje (no confía en el cliente). | [`reglas.js` puntosMensaje/puntosLlamada](../app/js/reglas.js) · `api.test.js` "el servidor recalcula puntos" |
| RF09 | Debrief sin culpa del sensei | FR | Alta | HU08, HU09 | Prototipo | **Implementado** | Resultado, señales marcadas, acción, frase en el tono elegido, botón escuchar. | P09 · `reglas.test.js` "frases sin culpa" |
| RF10 | Perfil persistente y dificultad adaptativa | FR | Alta | HU02, HU10 | Parcial | **Implementado** | Acierto por táctica, ritmo (tiempo por combate), emociones; 3 aciertos suben / 2 errores bajan. | [`reglas.js` aplicarCombate](../app/js/reglas.js), [`store.js`](../src/server/store.js) · P10 · `reglas.test.js` |
| RF11 | Check-in emocional y ajuste de tono | FR | Media | HU11 | Prototipo | **Implementado** | Antes (1 vez al día) y después del combate; "estresado/cansado" = modo práctica, voz más lenta, humor suave, combates más fáciles. | [`reglas.js` tonoSensei](../app/js/reglas.js) · P05, P09 · `reglas.test.js` |
| RF12 | Puntos y cinturones | FR | Alta | HU12 | Prototipo | **Implementado** | 7 cinturones; animación, sonido y confeti al subir; logros. | P09 · captura `P09-debrief-cinturon.png` |
| RF13 | Panel de progreso | FR | Alta | HU13 | Prototipo | **Implementado** | Cinturón, tácticas débiles, historial, diario del guardián, logros. | P10 |
| RF14 | Salas por código/QR | FR | Alta | HU14 | Prototipo | **Implementado** | Crear sala, código de 6 caracteres, QR real que abre la app y une a la sala, miembros conectados en vivo. | POST /api/salas, /unirse, /qr.svg · P11 · captura `P11-qr.png` |
| RF15 | Torneos por equipos en tiempo real | FR | Alta | HU15 | Simulado | **Implementado** | Mismo set; marcador por SSE en todos los dispositivos; podio al terminar. | [`tiempo-real.js`](../src/server/tiempo-real.js) · P12 · `api.test.js` "marcador del torneo en vivo por SSE" |
| RF16 | Tablero de cinturones con alias | FR | Media | HU16 | Prototipo | **Implementado** | Vista equipo/individual; alias reemplaza nombre; nunca se muestran errores. | GET /api/salas/:codigo/tablero · P13 |
| RF17 | Panel admin: salas, torneos, métricas | FR | Alta | HU17, HU19 | Parcial | **Implementado** | Torneo con código y QR; métricas agregadas por área y semana. | GET /api/admin/metricas · P15 |
| RF18 | Revisión/aprobación de escenarios generados | FR | Media | HU18 | Parcial | **Implementado** | Aprobar, editar, rechazar; solo aprobados en torneos (el API lo bloquea). | PUT /api/admin/escenarios/:id · P15 · `api.test.js` "torneo con escenario no aprobado" |
| RF19 | Comandos de voz | FR | Media | HU20 | Diseñado | **Implementado** | Botón de voz global (o tecla V) en todas las pantallas; confirmación visual del comando reconocido. | [`voz.js` interpretar](../app/js/voz.js), [`app.js` ejecutarComando](../app/js/app.js) |
| RF20 | Pistas con costo | FR | Baja | HU21 | Prototipo | **Implementado** | Máx. 2 pistas, −10 pts c/u, leídas en voz alta. | P07 |
| RF21 | Modo offline con sincronización | FR | Media | HU22 | Diseñado | **Implementado** | App y banco en caché; combates en cola; al reconectar se envían en lote sin duplicar. | [`sw.js`](../app/sw.js), [`api.js` sincronizar](../app/js/api.js), POST /api/combates/lote · `api.test.js` "sin puntos duplicados" |
| RF22 | Exportar reportes PDF/CSV | FR | Baja | HU19, HU24 | Pendiente | **Parcial** | CSV real desde el API; PDF con el diálogo de impresión del navegador (hoja de estilos de impresión). | GET /api/admin/metricas.csv · P10, P15 |
| RF23 | Sensei conversacional por voz | FR | Media | HU25 | — | **Implementado** | STT → LLM → TTS en ≤ 3 oraciones con contexto; fallback a FAQ. | [`gateway.js` conversar](../src/llm/gateway.js), POST /api/sensei · P16 · `llm.test.js` "el sensei responde aunque no haya LLM" |
| RNF01 | Usabilidad: SUS ≥ 75, primer combate < 5 min | NFR | Alta | HU02, HU04, HU08 | Pendiente | **Pendiente** | SUS con 5–8 usuarios. | Plan de pruebas con usuarios para la semana del 23/11. |
| RNF02 | Accesibilidad WCAG 2.2 AA | NFR | Alta | HU07, HU20 | Parcial | **Parcial** | 0 violaciones en axe; teclado; lector de pantalla. | Auditoría axe-core 4.x: **0 violaciones WCAG 2.2 A/AA en 15 pantallas** (ver informe PC03 §6). Falta prueba con lector de pantalla real. |
| RNF03 | Latencia chat < 3 s, voz < 2.5 s (p90) | NFR | Alta | HU03, HU06 | Pendiente | **Parcial** | Medición p90. | El gateway mide p50/p90 (`/api/salud`); falta medir con un proveedor real en 50 interacciones. |
| RNF04 | PWA instalable | NFR | Alta | HU22 | Parcial | **Implementado** | Manifest con íconos PNG 192/512, SW activo, instalable. | [`manifest.webmanifest`](../app/manifest.webmanifest), [`sw.js`](../app/sw.js) |
| RNF05 | Privacidad y Ley 29733 | NFR | Alta | HU11, HU16 | Diseñado | **Implementado** | Audio nunca se envía ni guarda; emociones solo agregadas (≥ 5); grupos < 3 personas ocultos. | AdminService en [`app.js`](../src/server/app.js) · `api.test.js` "métricas: solo admin…" |
| RNF06 | HTTPS, JWT, API keys en backend | NFR | Alta | HU01, HU23 | Diseñado | **Parcial** | JWT 1 h; keys solo en `.env`; rate limiting. HTTPS opcional (`HTTPS_CERT`/`HTTPS_KEY`) o túnel. | [`auth.js`](../src/server/auth.js) · `api.test.js` "JWT" |
| RNF07 | Contenido seguro del LLM | NFR | Alta | HU03, HU18 | Diseñado | **Implementado** | 100 % de enlaces y correos a `.test`; marcas reales → ficticias; validación de esquema y bloqueo de contenido peligroso. | [`guardrails.js`](../src/llm/guardrails.js) · `llm.test.js` (3 pruebas) |
| RNF08 | Proveedor por `.env` + pruebas con 2 proveedores | NFR | Alta | HU23 | Diseñado | **Implementado** | Pruebas con proveedor mock y proveedor tipo LLM. | `llm.test.js` |
| RNF09 | 50 usuarios concurrentes por sala | NFR | Media | HU15 | Pendiente | **Pendiente** | Prueba de carga. | SSE probado con 2–3 dispositivos; prueba de carga con k6 para la entrega final. |
| RNF10 | Fallback si falla el LLM | NFR | Alta | HU03 | Diseñado | **Implementado** | Fallback en el tiempo de `LLM_TIMEOUT_MS` (20 s por defecto, configurable) o ante cualquier error del proveedor. | `llm.test.js` "timeout" |
| RNF11 | Español claro (Perú) | NFR | Media | HU08 | Prototipo | **Implementado** | Revisión de textos. | Textos de pantallas, escenarios y FAQ. |
| RNF12 | Tono sin culpa | NFR | Alta | HU08, HU09 | Prototipo | **Implementado** | 0 frases de culpa. | `reglas.test.js`; prompt del sistema del LLM. |
| RNF13 | Repo con README, C4, instalación, datos, LICENSE | NFR | Alta | HU23 | Prototipo | **Implementado** | Archivos presentes. | Raíz del repositorio. |
| RNF14 | Laptop 4 GB y móvil gama media | NFR | Media | HU22, HU14 | Parcial | **Parcial** | Sin degradación notable. | Sin dependencias pesadas (solo `qrcode` opcional); probado en Chrome escritorio y vista móvil; falta Safari iOS. |

**Resumen PC03:** RF: 22 implementados y 1 parcial de 23. RNF: 8 implementados, 4 parciales y 2 pendientes de 14.

## Pantallas referenciadas

| ID | Pantalla | Propósito |
| :--- | :--- | :--- |
| P01 | Bienvenida | Presenta al sensei y el concepto del dojo. |
| P02 | Ingreso | Correo o código de organización. |
| P03 | Rol y preferencias | Nombre, rol, nivel de humor, voz, subtítulos, sonidos, alias, tamaño de letra. |
| P04 | Calibración | 3 preguntas rápidas para el nivel inicial. |
| P05 | Dojo (inicio) | Check-in emocional, cinturón, combate sugerido, combate generado por IA. |
| P06 | Camino de combates | Lista de escenarios por rol y estado. |
| P07 | Combate (correo/chat/SMS/presencial) | Mensaje inspeccionable, pistas y acciones. |
| P08 | Llamada de vishing | Llamada entrante, voz, subtítulos y respuestas. |
| P09 | Debrief del sensei | Resultado, señales, acción, puntos, logros, emoción posterior. |
| P10 | Mi progreso | Cinturón, diario del guardián, tácticas débiles, historial, PDF. |
| P11 | Salas | Unirse/crear sala, QR, miembros conectados, torneos. |
| P12 | Torneo en curso | Combates del torneo y marcador en vivo. |
| P13 | Tablero de cinturones | Ranking por equipos / individual con alias. |
| P14 | Ajustes | Preferencias, velocidad de voz, sincronización, sesión. |
| P15 | Panel administrador | Métricas, revisión de escenarios de IA, creación de torneos. |
| P16 | Sensei por voz *(nueva en PC03)* | Conversación por voz con el asistente (STT + LLM + TTS). |
