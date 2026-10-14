# C4 nivel 3: componentes del API

- `AuthController` · registro, código de organización, JWT.
- `PerfilService` · actualiza aciertos por táctica, nivel y emoción declarada después de cada combate.
- `DificultadService` · regla: 3 aciertos seguidos suben nivel, 2 errores seguidos bajan; prioriza tácticas con acierto < 60 %.
- `EscenarioService` · pide al gateway, guarda borradores para revisión del admin.
- `EvaluacionService` · combina reglas (acción elegida, señales inspeccionadas) con la evaluación del LLM para respuestas de voz.
- `TorneoService` · arma sets de escenarios y emite puntajes por WebSocket.
