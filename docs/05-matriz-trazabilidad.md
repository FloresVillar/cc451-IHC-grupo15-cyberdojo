# Matriz de trazabilidad

Estados: **Prototipo** = implementado en el prototipo de fidelidad media; **Diseñado** = definido en diseño, se implementa en el sprint indicado; **Pendiente** = planificado para sprint posterior. Las pantallas se identifican como P01–P15, que se listan al final de este documento.

| ID Req | Descripción del Requerimiento | Tipo (FR/NFR) | Prioridad | Historia(s) de Usuario que lo cubre(n) | ID HU | Estado | Criterio de Aceptación | Evidencia/Observación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RF01 | Registro/ingreso con rol | FR | Alta | Registro con rol | HU01 | Prototipo | Cuenta creada con correo o código válido; rol guardado y editable. | P02, P03. Validación de código simulada. |
| RF02 | Onboarding con calibración y preferencias | FR | Alta | Calibración inicial | HU02 | Prototipo | 3 preguntas; nivel inicial asignado; opción de saltar. | P01, P03. |
| RF03 | Generación de escenarios por LLM según rol y dificultad | FR | Alta | Escenario según mi rol | HU03 | Diseñado (Sprint 1) | ≥ 70% escenarios del rol; fallback si > 3 s. | En prototipo se usan los 15 escenarios de `data/escenarios/`. |
| RF04 | Capa de abstracción de proveedor LLM | FR | Alta | Cambiar proveedor de LLM | HU23 | Diseñado (Sprint 1) | Cambio de proveedor solo por `.env`. | Interfaz en `src/llm/llm-client.js`, proveedores en `src/llm/providers/`. |
| RF05 | Simulación de correo/SMS/chat inspeccionable con acciones | FR | Alta | Inspeccionar un mensaje; Tomar una decisión | HU04, HU05 | Prototipo | Enlaces muestran URL sin navegar; 4 acciones visibles. | P07. |
| RF06 | Llamada de vishing por voz multiturno | FR | Alta | Llamada de vishing por voz | HU06 | Prototipo | TTS + micrófono; máximo 3 turnos; respuesta evaluada. | P08 con Web Speech API (Chrome). |
| RF07 | Subtítulos y respuesta escrita en llamadas | FR | Alta | Llamada sin audio | HU07 | Prototipo | Subtítulos sincronizados; respuestas rápidas y campo de texto. | P08. |
| RF08 | Evaluación de decisión y señales | FR | Alta | Tomar una decisión; Llamada de vishing | HU05, HU06 | Prototipo | Puntaje por acción correcta + señales revisadas. | Lógica simple en prototipo; en producción la evalúa el LLM. |
| RF09 | Debrief sin culpa del sensei | FR | Alta | Debrief sin culpa; Nivel de humor | HU08, HU09 | Prototipo | Muestra resultado, señales, acción y frase; botón escuchar. | P09. |
| RF10 | Perfil persistente y dificultad adaptativa | FR | Alta | Calibración; Dificultad adaptativa | HU02, HU10 | Prototipo (parcial) | Acierto por táctica actualizado; sube/baja dificultad según regla. | Perfil en `localStorage` del prototipo; en producción en PostgreSQL. |
| RF11 | Check-in emocional y ajuste de tono | FR | Media | Check-in emocional | HU11 | Prototipo | 4 emojis; "estresado" activa modo sin reloj. | P05 (modal). |
| RF12 | Puntos y cinturones | FR | Alta | Ganar cinturones | HU12 | Prototipo | 7 cinturones con umbrales; animación < 2 s. | P09, P10. |
| RF13 | Panel de progreso | FR | Alta | Ver mi progreso | HU13 | Prototipo | Cinturón, puntos débiles e historial visibles. | P10. |
| RF14 | Salas por código/QR | FR | Alta | Unirme a una sala | HU14 | Prototipo | Código de 6 caracteres; lista de miembros. | P11 (miembros simulados). |
| RF15 | Torneos por equipos en tiempo real | FR | Alta | Torneo por equipos | HU15 | Prototipo (simulado) | Mismo set; puntaje actualizado < 1 s; podio por equipos. | P12; tiempo real simulado con temporizador. WebSockets en Sprint 4. |
| RF16 | Tablero de cinturones con alias | FR | Media | Tablero con alias | HU16 | Prototipo | Vista equipo/individual; alias reemplaza nombre. | P13. |
| RF17 | Panel admin: salas, torneos, métricas | FR | Alta | Crear torneo; Métricas del equipo | HU17, HU19 | Prototipo (parcial) | Torneo creado genera código y QR; métricas agregadas. | P15 con datos simulados. |
| RF18 | Revisión/aprobación de escenarios | FR | Media | Revisar escenarios generados | HU18 | Prototipo (parcial) | Solo aprobados se usan en torneo. | P15, pestaña "Escenarios". |
| RF19 | Comandos de voz | FR | Media | Navegar por voz | HU20 | Diseñado (Sprint 2) | 5 comandos reconocidos con confirmación visual. | Botón de micrófono en P07/P08 como maqueta. |
| RF20 | Pistas con costo | FR | Baja | Pedir pista | HU21 | Prototipo | Máx. 2 pistas, −10 pts c/u. | P07. |
| RF21 | Modo offline con sincronización | FR | Media | Jugar sin conexión | HU22 | Diseñado (Sprint 3) | 15 escenarios en caché; sin puntos duplicados. | `public/sw.js` cachea el shell del prototipo. |
| RF22 | Exportar reportes PDF/CSV | FR | Baja | Métricas del equipo; Exportar mi progreso | HU19, HU24 | Pendiente (Sprint 4) | PDF/CSV descargable con datos correctos. | Botón visible en P10 y P15 (no funcional). |
| RNF01 | Usabilidad: SUS ≥ 75, primer combate < 5 min | NFR | Alta | Calibración; Inspeccionar; Debrief | HU02, HU04, HU08 | Pendiente (pruebas) | SUS ≥ 75 con 5–8 usuarios; 90% completa sin ayuda. | Plan de pruebas en sección 7; prueba piloto programada para la semana del 23/11. |
| RNF02 | Accesibilidad WCAG 2.2 AA | NFR | Alta | Llamada sin audio; Navegar por voz | HU07, HU20 | Prototipo (parcial) | Contraste ≥ 4.5:1; teclado; lector de pantalla. | Prototipo con roles ARIA y foco visible; falta auditoría con axe. |
| RNF03 | Latencia chat < 3 s, voz < 2.5 s (p90) | NFR | Alta | Escenario según rol; Llamada de vishing | HU03, HU06 | Pendiente (Sprint 2) | Medición p90 en 50 interacciones. | Se medirá con logs del gateway. |
| RNF04 | PWA instalable, Lighthouse ≥ 90 | NFR | Alta | Jugar sin conexión | HU22 | Prototipo (parcial) | Manifest + SW; instalable en Chrome y Safari. | `public/manifest.webmanifest` y `public/sw.js`. |
| RNF05 | Privacidad y Ley 29733 | NFR | Alta | Check-in emocional; Tablero con alias | HU11, HU16 | Diseñado | Audio no almacenado; emoción no visible al admin. | Política en README. |
| RNF06 | HTTPS, JWT, API keys en backend | NFR | Alta | Registro con rol; Cambiar proveedor | HU01, HU23 | Diseñado (Sprint 1) | Sin API keys en el cliente; JWT 1 h. | Ver diagrama C4 (contenedores). |
| RNF07 | Contenido seguro del LLM | NFR | Alta | Escenario según rol; Revisar escenarios | HU03, HU18 | Diseñado (Sprint 1) | 100% enlaces reescritos a `.test`. | Datos simulados ya usan `.test`. |
| RNF08 | Mantenibilidad: proveedor por `.env` | NFR | Alta | Cambiar proveedor de LLM | HU23 | Diseñado (Sprint 1) | Pruebas con 2 proveedores. | `src/llm/`. |
| RNF09 | 50 usuarios concurrentes por sala | NFR | Media | Torneo por equipos | HU15 | Pendiente (Sprint 4) | Prueba de carga con k6. | — |
| RNF10 | Fallback al banco si falla el LLM | NFR | Alta | Escenario según rol | HU03 | Diseñado (Sprint 1) | Fallback < 3 s. | El prototipo ya funciona solo con el banco. |
| RNF11 | Español claro (Perú) | NFR | Media | Debrief sin culpa | HU08 | Prototipo | Revisión de textos. | Textos de los 15 escenarios. |
| RNF12 | Tono sin culpa | NFR | Alta | Debrief sin culpa; Nivel de humor | HU08, HU09 | Prototipo | Checklist de tono al 100% de debriefs. | Debriefs en `data/escenarios/`. |
| RNF13 | Repo con README, C4, instalación, datos, LICENSE | NFR | Alta | Cambiar proveedor de LLM | HU23 | Prototipo | Archivos presentes en la raíz. | Raíz del repositorio. |
| RNF14 | Compatibilidad laptop 4 GB y móvil gama media | NFR | Media | Jugar sin conexión; Unirme a sala | HU22, HU14 | Prototipo (parcial) | Sin degradación notable. | Prototipo sin dependencias pesadas; probado en Chrome de escritorio, falta probar en Android/iOS. |

## Pantallas referenciadas

| ID | Pantalla | Propósito |
| :--- | :--- | :--- |
| P01 | Bienvenida | Presenta al sensei y el concepto del dojo. |
| P02 | Ingreso | Correo o código de organización. |
| P03 | Rol y preferencias | Rol, nivel de humor, voz, subtítulos, alias, tamaño de letra. |
| P04 | Calibración | 3 preguntas rápidas para el nivel inicial. |
| P05 | Dojo (inicio) | Check-in emocional, cinturón, combate sugerido, accesos. |
| P06 | Camino de combates | Lista de escenarios por rol y estado. |
| P07 | Combate (correo/chat/SMS) | Mensaje inspeccionable, pistas y acciones. |
| P08 | Llamada de vishing | Llamada entrante, voz, subtítulos y respuestas. |
| P09 | Debrief del sensei | Resultado, señales, acción recomendada, puntos. |
| P10 | Mi progreso | Cinturón, tácticas débiles, historial. |
| P11 | Salas | Unirse/crear sala, miembros, próximo torneo. |
| P12 | Torneo en curso | Combates del torneo y marcador de equipos. |
| P13 | Tablero de cinturones | Ranking por equipos / individual con alias. |
| P14 | Ajustes | Preferencias y accesibilidad. |
| P15 | Panel administrador | Crear torneo, revisar escenarios, métricas. |
