# C4 nivel 2: contenedores

![Contenedores](img/c4-contenedores.png)

| Contenedor | Tecnología | Responsabilidad |
|---|---|---|
| PWA cliente | React + Vite, Service Worker | Interfaz del dojo, combates, llamada por voz, caché offline de escenarios. |
| API de aplicación | Node.js + Express | Autenticación (JWT), perfiles, reglas de dificultad, evaluación, panel admin. |
| Servicio de torneos | Socket.IO | Salas, marcador en vivo y tablero de cinturones. |
| LLM Gateway | Módulo Node.js | Interfaz única `generarEscenario()` / `evaluarRespuesta()`, adaptadores por proveedor, guardrails y fallback. |
| Base de datos | PostgreSQL | Usuarios, perfiles adaptativos, escenarios aprobados, resultados, salas. |
| Banco de escenarios | JSON versionado | 15 escenarios MVP; semilla para el LLM y respaldo si falla. |

## Decisiones de arquitectura

1. **Gateway propio en vez de llamar al LLM desde el cliente.** Las API keys no pueden estar en el navegador y así cambiamos de proveedor sin tocar la app (RF04, RNF06, RNF08).
2. **Voz en el navegador primero.** La Web Speech API no cuesta y responde rápido en Chrome; el STT/TTS en la nube queda como respaldo para navegadores sin soporte.
3. **Banco de escenarios como semilla y fallback.** El LLM no inventa desde cero: adapta una plantilla revisada. Si tarda más de 3 s o falla, se usa la plantilla tal cual (RNF10).
4. **Guardrails de salida.** Todo enlace o correo generado se reescribe a `.test` (RNF07). El admin aprueba los escenarios antes de usarlos en torneos (RF18).

Fuente: [`fuentes/c4-contenedores.dot`](fuentes/c4-contenedores.dot).
