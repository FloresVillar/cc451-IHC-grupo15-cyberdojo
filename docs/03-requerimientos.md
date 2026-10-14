# Requerimientos y alcance

## Alcance del MVP

15 escenarios (3 roles + escenarios generales, 4 de ellos por voz), evaluación de progreso, perfil adaptativo, salas y torneos por equipos, y panel básico para el administrador. Todo como PWA que corre en laptop y en celular.

## Requerimientos funcionales (RF)

| ID | Requerimiento | Prioridad |
| :--- | :--- | :--- |
| RF01 | El sistema debe permitir registrarse e iniciar sesión con correo o con código de organización, eligiendo un rol (contador, desarrollador, recepción, otro). | Alta |
| RF02 | El sistema debe ofrecer un onboarding con calibración inicial (3 preguntas) y elección de preferencias: voz, nivel de humor y accesibilidad. | Alta |
| RF03 | El sistema debe generar escenarios mediante el LLM adaptados al rol y a la dificultad actual del usuario, usando las plantillas del banco de 15 escenarios. | Alta |
| RF04 | El sistema debe acceder al LLM a través de una capa de abstracción que permita cambiar de proveedor (remoto o local) solo con configuración. | Alta |
| RF05 | El sistema debe simular correos, SMS y chats con elementos inspeccionables (remitente, enlaces, adjuntos) y acciones: reportar, verificar por otro canal, responder, marcar como legítimo. | Alta |
| RF06 | El sistema debe simular llamadas de vishing por voz: voz sintética del atacante, reconocimiento de la respuesta hablada y conversación de varios turnos. | Alta |
| RF07 | El sistema debe ofrecer subtítulos en vivo y respuesta escrita en toda llamada simulada. | Alta |
| RF08 | El sistema debe evaluar la decisión del usuario y las señales de alerta que identificó, y asignar un puntaje por combate. | Alta |
| RF09 | El sistema debe mostrar un debrief inmediato del sensei con las señales de alerta, la acción recomendada y un mensaje sin culpa, en el tono de humor elegido. | Alta |
| RF10 | El sistema debe mantener un perfil persistente (aciertos y errores por táctica, tiempos de respuesta, preferencias, emoción declarada) y ajustar la dificultad después de cada combate. | Alta |
| RF11 | El sistema debe permitir un check-in emocional opcional (antes/después del combate) y adaptar el tono e intensidad según la respuesta. | Media |
| RF12 | El sistema debe otorgar puntos y cinturones (blanco a negro) según el desempeño acumulado. | Alta |
| RF13 | El sistema debe mostrar un panel de progreso con cinturón actual, puntos débiles por táctica e historial de combates. | Alta |
| RF14 | El sistema debe permitir crear y unirse a salas mediante código o QR. | Alta |
| RF15 | El sistema debe permitir torneos por equipos donde todos resuelven el mismo set de escenarios y los puntos se suman por equipo en tiempo real. | Alta |
| RF16 | El sistema debe mostrar un tablero de cinturones por equipo e individual, con opción de alias. | Media |
| RF17 | El sistema debe ofrecer un panel de administrador para crear salas/torneos, asignar escenarios por rol y ver métricas agregadas y anónimas. | Alta |
| RF18 | El sistema debe permitir al administrador revisar, editar y aprobar escenarios generados antes de usarlos en un torneo. | Media |
| RF19 | El sistema debe aceptar comandos de voz básicos: "reportar", "repetir", "pista", "siguiente", "colgar". | Media |
| RF20 | El sistema debe ofrecer hasta 2 pistas por escenario, con un pequeño costo en puntos. | Baja |
| RF21 | El sistema debe permitir jugar escenarios del banco sin conexión y sincronizar el progreso al reconectar. | Media |
| RF22 | El sistema debe permitir exportar el reporte de progreso (usuario) y el reporte del equipo (admin) en PDF o CSV. | Baja |

## Requerimientos no funcionales (RNF)

| ID | Categoría | Requerimiento | Métrica de verificación |
| :--- | :--- | :--- | :--- |
| RNF01 | Usabilidad | La app debe ser fácil de aprender y usar sin capacitación previa. | SUS ≥ 75; primer combate completado en < 5 min sin ayuda por el 90% de los participantes. |
| RNF02 | Accesibilidad | Cumplir WCAG 2.2 nivel AA. | Contraste ≥ 4.5:1, navegación 100% por teclado, 0 errores críticos en axe/Lighthouse, prueba con lector de pantalla. |
| RNF03 | Rendimiento | Respuestas rápidas en chat y voz. | Chat: primer token < 1.5 s y respuesta completa < 3 s (p90). Voz: turno completo < 2.5 s (p90). |
| RNF04 | Plataforma (PWA) | Instalable y funcional en laptop y móvil. | Manifest válido, service worker activo, Lighthouse PWA ≥ 90; probado en Chrome, Edge y Safari iOS. |
| RNF05 | Privacidad | Datos personales mínimos; el audio no se almacena. | Solo se guardan transcripciones si el usuario lo acepta; cumplimiento de la Ley 29733 de protección de datos personales. |
| RNF06 | Seguridad | Comunicación y credenciales protegidas. | HTTPS obligatorio, JWT con expiración de 1 h, API keys solo en el backend, rate limiting por usuario. |
| RNF07 | Seguridad del contenido | El LLM no debe producir enlaces funcionales, malware ni datos reales. | Filtro de salida: 100% de enlaces reescritos a dominios `.test`; lista de bloqueo de marcas reales; revisión de 50 generaciones sin fallas. |
| RNF08 | Mantenibilidad | Cambiar de proveedor LLM sin tocar el código de negocio. | Cambio de proveedor solo editando `.env`; pruebas unitarias del gateway con 2 proveedores. |
| RNF09 | Escalabilidad | Soportar torneos simultáneos. | 50 usuarios concurrentes por sala con latencia de actualización del tablero < 1 s. |
| RNF10 | Disponibilidad | Si el LLM falla, la experiencia no se corta. | Fallback automático al banco de escenarios en < 3 s ante timeout o error. |
| RNF11 | Lenguaje | Español claro y cercano (Perú). | Textos revisados con prueba de lectura; sin tecnicismos sin explicar. |
| RNF12 | Diseño emocional | Ningún mensaje culpabiliza al usuario. | Checklist de tono aplicado al 100% de los debriefs; 0 mensajes con palabras como "fallaste" o "error grave". |
| RNF13 | Entrega / licencia | Repositorio abierto y documentado. | README, C4, guía de instalación, datos simulados y LICENSE MIT presentes. |
| RNF14 | Compatibilidad | Corre en equipos comunes. | Laptop con 4 GB RAM y celular Android/iOS de gama media sin degradación notable. |
