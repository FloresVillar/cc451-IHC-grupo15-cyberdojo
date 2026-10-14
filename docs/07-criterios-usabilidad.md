# Criterios de usabilidad

Usamos los objetivos de usabilidad de Preece/Rogers (efectividad, eficiencia, seguridad, utilidad, facilidad de aprendizaje y memorabilidad), la accesibilidad y las 10 heurísticas de Nielsen, pero bajados a cosas que podamos medir en CyberDojo.

| Criterio | Qué significa en CyberDojo | Métrica / meta | Cómo lo medimos |
| :--- | :--- | :--- | :--- |
| Facilidad de aprendizaje | Entender el dojo y hacer el primer combate sin tutorial largo. | Primer combate completado en < 5 min por el 90% de usuarios. | Prueba con 5–8 usuarios, cronómetro. |
| Eficiencia | Llegar a un combate desde el inicio rápido. | Máximo 2 toques desde el Dojo hasta un combate. | Análisis del flujo (diagrama de interacciones). |
| Eficacia (efectividad) | Que el entrenamiento mejore la detección. | +25% de tasa de detección entre la semana 1 y la semana 4. | Comparar resultados del perfil. |
| Prevención de errores (seguridad) | No penalizar acciones por accidente. | Confirmación en acciones riesgosas ("responder", "abrir adjunto"); deshacer disponible 5 s. | Revisión heurística. |
| Utilidad | Que los escenarios sirvan para el trabajo real de cada rol. | ≥ 4/5 en "los ataques se parecen a los que me pueden llegar", en cada rol. | Pregunta adicional al cuestionario SUS, separada por rol. |
| Memorabilidad | Volver después de una semana y seguir sin ayuda. | ≥ 90% completa un combate en la segunda sesión (7 días después) sin pedir ayuda. | Segunda sesión con los mismos participantes. |
| Visibilidad del estado | Saber siempre en qué combate estoy, cuánto falta y si el micrófono escucha. | Indicador de micrófono y progreso en el 100% de pantallas de combate. | Revisión heurística + observación. |
| Satisfacción | Que la experiencia sea agradable. | SUS ≥ 75 y ≥ 4/5 en "me gustaría seguir usándola". | Cuestionario SUS + pregunta adicional. |
| Accesibilidad | Usable con lector de pantalla, teclado y sin audio. | WCAG 2.2 AA, 0 errores críticos en axe. | Auditoría automática + prueba con lector de pantalla. |
| Recuperación emocional | No abandonar después de fallar. | ≥ 80% de usuarios que fallan un combate inician otro en la misma sesión. | Métrica de la app. |
| Consistencia | Las mismas acciones en el mismo lugar en todos los combates. | Barra de acciones fija abajo en P07 y P08. | Revisión heurística. |

**Diseño emocional (Norman), aplicado:**

- **Visceral:** estética de dojo (tatami, papel, tinta), sensei con expresiones, sonido de gong al ganar. La primera impresión no debe ser "otra capacitación corporativa".
- **Conductual:** respuesta inmediata a cada acción, micro-interacciones (el enlace "tiembla" al inspeccionarlo, la tarjeta de señal se marca con un sello), vibración corta al reportar, voz natural del atacante.
- **Reflexivo:** cinturones que se pueden compartir, rol de "guardián" del equipo, mensajes del sensei que reconocen el esfuerzo ("te costó, pero lo viste a tiempo"). El aprendizaje se siente propio, no impuesto.
