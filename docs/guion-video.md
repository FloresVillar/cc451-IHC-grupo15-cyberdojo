# Guion del video de sustentación · PC03

**Duración total: 6 minutos** (2 integrantes × 3 minutos; el máximo permitido para grupos de hasta 3 es 9). Un solo video por grupo. Cada integrante aparece en cámara o con su voz mientras demuestra su parte.

## Antes de grabar

1. `npm run reset` y luego `npm start` (base limpia; el torneo de ejemplo empieza al iniciar).
2. Chrome con el micrófono permitido en `http://localhost:8080/app/`. Ventana normal: Rosa. Ventana de incógnito: Diego (para el multiusuario).
3. "Reiniciar demo" en ambas ventanas. Volumen del sistema activado (se graba la voz del atacante y del sensei).
4. Si tienen una API key, configúrenla en `.env` (por ejemplo Gemini) para mostrar el LLM en vivo. Si no, mostrar el modo `mock` y explicar el fallback.
5. Grabar pantalla con OBS o la grabadora de Windows (Win + Alt + R) a 1080p.

---

## Parte 1 · Junior Ortega · 0:00–3:00 · PWA, voz y diseño emocional

| Tiempo | Qué mostrar | Qué decir (idea) |
|---|---|---|
| 0:00–0:20 | P01 | "CyberDojo entrena a los colaboradores contra phishing y vishing practicando, no viendo videos. Soy Junior y mostraré la app, la voz y el diseño emocional." |
| 0:20–0:45 | Ingreso como Rosa → check-in "estresado" → P05 | "El perfil viene del servidor. Declaré que estoy estresado: el sensei cambia el tono, activa modo práctica y baja la dificultad. Eso es personalización con emociones declaradas." |
| 0:45–1:25 | Combate de correo E01: tocar remitente y enlace → decir "reportar" con el botón 🎙️ | "Todo se puede hacer por voz. Inspecciono el remitente, el enlace no navega… y digo 'reportar'." Mostrar gong, sello, debrief sin culpa y subida de cinturón con confeti. |
| 1:25–2:20 | Llamada E03: contestar, escuchar al atacante, responder hablando "¿de qué área me dijo?" y luego "no comparto códigos, voy a llamar al número oficial" | "Suena el teléfono. Cuando el atacante termina, el micrófono se activa solo y veo la transcripción en vivo. Una respuesta ambigua la evalúa el LLM y el atacante insiste. Siempre hay subtítulos, respuestas rápidas y texto para quien no puede hablar u oír." |
| 2:20–2:45 | Debrief → emoción "confundido" → P16: preguntar por voz "¿por qué era sospechoso?" | "Si marco que quedé confundido, el sensei ofrece explicarme. Le pregunto en voz alta y responde en voz alta con el contexto del combate." |
| 2:45–3:00 | P10 progreso + activar modo avión (F12 → Offline) y mostrar "1 combate guardado" | "El progreso muestra tácticas débiles, logros y el diario del guardián. Es una PWA: sin internet sigo entrenando y se sincroniza al volver." |

## Parte 2 · Esau Flores · 3:00–6:00 · Backend, LLM, multiusuario y administrador

| Tiempo | Qué mostrar | Qué decir (idea) |
|---|---|---|
| 3:00–3:30 | Diagrama C4 nivel 2 (`docs/img/c4-contenedores.png`) | "Soy Esau. La PWA habla con un API en Node.js con JWT, persistencia y tiempo real por Server-Sent Events. El LLM está detrás de un gateway." |
| 3:30–4:10 | `.env` y terminal: `npm run demo:llm` · luego P05 "✨ Combate generado por IA" | "Cambiar de proveedor es cambiar una línea: Anthropic, OpenAI, Gemini u Ollama local. El gateway genera un combate para el rol y la táctica débil, reescribe enlaces y marcas reales a ficticias, valida el JSON y, si el proveedor falla o tarda demasiado, usa el banco." |
| 4:10–5:00 | Rosa y Diego en dos ventanas: Salas → "2 conectados" → QR → entrar al torneo → Diego reporta un combate → el marcador de Rosa cambia | "Multiusuario real: los dos estamos en la sala, se ve quién está conectado y el QR une a la sala desde la cámara del celular. En el torneo, el punto de Diego aparece en la pantalla de Rosa al instante." |
| 5:00–5:40 | P15 como admin: métricas (evolución 57 % → 76 %), aprobar un escenario de IA, crear torneo con QR, exportar CSV | "El administrador ve métricas agregadas y anónimas: grupos de menos de 3 personas y emociones individuales nunca se muestran. Los escenarios que genera la IA solo entran a torneos después de aprobarlos." |
| 5:40–6:00 | Terminal: `npm test` (26 pruebas en verde) y README | "Tenemos 26 pruebas automáticas, 0 violaciones de accesibilidad en axe, README, C4, guía de instalación, datos simulados y licencia MIT. Gracias." |

---

## Consejos

- Ensayen una vez con cronómetro: si se pasan, recorten la parte de progreso u offline.
- Hablen sobre lo que la pantalla muestra; no lean la tabla.
- Si el reconocimiento de voz falla en vivo, usen las respuestas rápidas y díganlo: también es parte del diseño accesible.
- Exporten en MP4 (H.264) y verifiquen que el video dure **menos de 9 minutos** antes de subirlo.
