# Guion del video · Parte 2 (Esau Flores)

Versión de trabajo de la Parte 2 del guion, actualizada con la configuración real (Edge, Groq, botón de usuario). El guion general del grupo está en [`guion-video.md`](guion-video.md); esta parte lo complementa.

## Parte 2 · Esau Flores · 3:00–6:00 · Backend, LLM, multiusuario y administrador

Preparación de esta parte: navegador **Edge** (el reconocimiento de voz es más estable que en Chrome), con una ventana normal para **Rosa** y una ventana **InPrivate** para **Diego**. El servidor debe haberse iniciado con `npm start` y mostrar `LLM: groq · modelo openai/gpt-oss-120b`.

| Tiempo | Qué mostrar | Qué decir (idea) |
|---|---|---|
| 3:00–3:30 | Diagrama C4 nivel 2 (`docs/img/c4-contenedores.png`) | "Soy Esau. La PWA habla con un API en Node.js con JWT, persistencia y tiempo real por Server-Sent Events. El LLM está detrás de un gateway." |
| 3:30–4:10 | Terminal con `npm start` (línea `LLM: groq · modelo openai/gpt-oss-120b`) y `npm run demo:llm` · luego P05 "✨ Combate nuevo generado por IA" | "Cambiar de proveedor es cambiar una línea del `.env`: Anthropic, OpenAI, Groq, Gemini u Ollama local. Nosotros usamos Groq con el modelo gpt-oss-120b. El gateway genera un combate para el rol y la táctica débil, reescribe enlaces y marcas reales a dominios ficticios, valida el JSON y, si el LLM tarda más del tiempo límite (10 segundos en nuestra configuración) o falla, usa el banco de escenarios." |
| 4:10–5:00 | Rosa y Diego en dos ventanas. Señalar el **botón de usuario** arriba a la derecha (muestra "Rosa" / "Diego"). Salas → "2 conectados" → mostrar el QR de la sala → entrar al torneo → Diego reporta un combate → el marcador de Rosa cambia | "Multiusuario real. Arriba a la derecha cada ventana muestra quién tiene la sesión: Rosa aquí, Diego allá. Los dos estamos en la sala y se ve quién está conectado. El QR sirve para unirse a la sala desde la cámara de un celular. En el torneo, el punto de Diego aparece en la pantalla de Rosa al instante." |
| 5:00–5:40 | P15 como admin ("Soy administrador", correo `javier.huaman@kallpa.test`): métricas del grupo, aprobar un escenario de IA, crear torneo con QR, exportar CSV | "El administrador ve métricas agregadas y anónimas: los grupos de menos de 3 personas y las emociones individuales nunca se muestran. Los escenarios que genera la IA solo entran a torneos después de aprobarlos." |
| 5:40–6:00 | Terminal: `npm test` (25 pruebas en verde) y README | "Tenemos 25 pruebas automáticas, 0 violaciones de accesibilidad en axe, README, C4, guía de instalación, datos simulados y licencia MIT. Gracias." |

**Cuidados al grabar esta parte**
- **No muestres el archivo `.env` completo:** contiene las claves de Groq y el `ADMIN_KEY`. Muestra solo la terminal de `npm start` o, si quieres enseñar la configuración, `.env.example`.
- Si Groq tarda o falla en vivo, el combate sale igual desde el banco. Dilo: es el fallback que describes en 3:30.
- Si Rosa y Diego quedan con la misma sesión, cierra sesión desde el botón de usuario (arriba a la derecha) y vuelve a ingresar.
- El celular es opcional para esta parte. Si lo quieres mostrar, necesita el túnel de Cloudflare del paso 9 de `COMO-EJECUTAR.md`.
