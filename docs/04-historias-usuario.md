# Historias de usuario

**HU01 – Registro con rol.** Como colaborador, quiero registrarme y elegir mi rol, para recibir ataques parecidos a los de mi trabajo.
- Dado que estoy en la pantalla de ingreso, cuando ingreso mi correo o un código de organización válido, entonces se crea mi cuenta.
- Dado que me registré, cuando elijo un rol, entonces queda guardado en mi perfil y puedo cambiarlo luego en Ajustes.
- Si el código de organización no existe, se muestra un mensaje claro y sugerencia para pedirlo a TI.

**HU02 – Calibración inicial.** Como colaborador nuevo, quiero responder unas preguntas rápidas al inicio, para no empezar con algo muy fácil ni muy difícil.
- Se muestran exactamente 3 preguntas tipo "¿Esto es sospechoso?" con una sola pantalla por pregunta.
- Al terminar, se asigna un nivel inicial (1, 2 o 3) visible en el perfil.
- Se puede saltar la calibración; en ese caso se empieza en nivel 1.

**HU03 – Escenario según mi rol.** Como contadora, quiero que los ataques hablen de facturas y transferencias, para practicar con situaciones que sí me pueden pasar.
- El escenario generado incluye el rol y la dificultad del usuario en el prompt (se puede verificar en el log del gateway).
- Al menos el 70% de los escenarios que recibe un usuario corresponden a su rol; el resto son "para todos".
- Si el LLM no responde en 3 s, se carga un escenario equivalente del banco.

**HU04 – Inspeccionar un mensaje.** Como colaborador, quiero tocar el remitente, los enlaces y los adjuntos, para ver los detalles antes de decidir.
- Al tocar el remitente se muestra el correo completo y el dominio resaltado.
- Al tocar un enlace no se navega: se muestra la URL real en un globo de vista previa.
- Cada elemento inspeccionado se registra como "señal revisada" para la evaluación.

**HU05 – Tomar una decisión.** Como colaborador, quiero elegir qué hacer con el mensaje (reportar, verificar, responder, marcar como legítimo), para practicar el procedimiento correcto.
- Las 4 acciones están visibles como botones con texto e ícono.
- Al elegir una acción, se pide confirmación solo si es "responder" o "abrir adjunto".
- Tras la decisión se pasa al debrief en menos de 1 s.

**HU06 – Llamada de vishing por voz.** Como colaborador, quiero recibir una llamada simulada y responder hablando, para entrenar cómo reacciono bajo presión.
- La pantalla de llamada entrante muestra "Contestar" y "Rechazar"; rechazar también se evalúa.
- La voz del atacante se reproduce y, al terminar, se activa el micrófono con un indicador visible.
- La respuesta transcrita se evalúa; si contiene una acción segura (colgar, verificar, no compartir), el combate termina con éxito.
- La llamada tiene máximo 3 turnos del atacante.

**HU07 – Llamada sin audio.** Como usuario con discapacidad auditiva (o en una oficina ruidosa), quiero ver subtítulos y responder escribiendo, para hacer los combates de voz sin desventaja.
- Los subtítulos aparecen sincronizados con la voz y se pueden activar por defecto desde Ajustes.
- Existe un campo de texto y respuestas rápidas en cada turno de la llamada.
- La puntuación no cambia por responder en texto.

**HU08 – Debrief sin culpa.** Como colaborador que cayó en un ataque, quiero una explicación clara y sin regaños, para aprender sin sentirme mal.
- El debrief muestra: resultado, señales de alerta (marcando las que sí detecté), acción recomendada y una frase del sensei.
- Ningún texto usa palabras de culpa (validado con el checklist de tono).
- El debrief se puede escuchar en voz alta con un botón.

**HU09 – Nivel de humor.** Como colaborador, quiero elegir si el sensei es serio o bromista, para que el tono me resulte cómodo.
- En Ajustes hay 3 niveles: "Serio", "Con algo de humor", "Modo chistoso".
- El nivel elegido se envía al LLM y cambia el texto del debrief.

**HU10 – Dificultad adaptativa.** Como colaborador, quiero que la app me ponga más casos de lo que más fallo, para mejorar donde realmente lo necesito.
- Tras cada combate se actualiza el porcentaje de acierto por táctica.
- Si una táctica tiene acierto < 60%, el siguiente escenario sugerido la incluye.
- Con 3 aciertos seguidos sube la dificultad; con 2 errores seguidos baja.

**HU11 – Check-in emocional.** Como colaborador, quiero decir cómo me siento antes de empezar, para que la app no me presione en un mal día.
- Se muestra una fila de 4 emojis opcionales al iniciar sesión (máximo una vez al día).
- Si elijo "estresado", se sugiere modo práctica sin reloj y el sensei usa un tono más suave.
- La respuesta se guarda en el perfil y no es visible para el administrador de forma individual.

**HU12 – Ganar cinturones.** Como colaborador, quiero subir de cinturón, para sentir que avanzo.
- Los cinturones son: blanco, amarillo, naranja, verde, azul, marrón y negro, con umbrales de puntos definidos.
- Al subir de cinturón se muestra una animación corta (< 2 s) y se puede compartir en la sala.

**HU13 – Ver mi progreso.** Como colaborador, quiero ver mis puntos débiles, para saber en qué enfocarme.
- El panel muestra cinturón actual, puntos para el siguiente, gráfico por táctica e historial de los últimos 10 combates.
- Las tácticas débiles aparecen primero y con una sugerencia de combate.

**HU14 – Unirme a una sala.** Como colaborador, quiero unirme a la sala de mi equipo con un código, para entrenar con mis compañeros.
- Puedo ingresar un código de 6 caracteres o escanear un QR.
- Al unirme, veo los miembros conectados y el próximo torneo programado.

**HU15 – Torneo por equipos.** Como colaborador, quiero competir con mi equipo contra otras áreas, para hacerlo más entretenido.
- Todos los participantes reciben el mismo set de escenarios.
- El puntaje del equipo se actualiza en tiempo real (< 1 s) en todos los dispositivos.
- Al final se muestra el podio de equipos, no el ranking de errores individuales.

**HU16 – Tablero con alias.** Como colaborador, quiero aparecer con un alias en el tablero, para participar sin exponerme.
- Puedo activar un alias en Ajustes; en el tablero solo aparece el alias.
- El tablero se puede ver por equipos o individual.

**HU17 – Crear torneo (admin).** Como responsable de TI, quiero crear una sala y un torneo con escenarios por rol, para organizar la capacitación del mes.
- Puedo definir nombre, fecha, duración, equipos y escenarios.
- Al guardar, se genera un código de sala y un QR para compartir.

**HU18 – Revisar escenarios generados (admin).** Como responsable de TI, quiero revisar los escenarios que genera la IA antes de publicarlos, para que se ajusten a nuestros procedimientos.
- Veo cada escenario con su texto, señales y acción correcta, y puedo editarlos.
- Solo los escenarios aprobados se pueden usar en torneos.

**HU19 – Métricas del equipo (admin).** Como responsable de TI, quiero ver métricas agregadas, para reportar a gerencia si el equipo mejora.
- El panel muestra tasa de detección, tasa de reporte y táctica más débil por área.
- No se muestran resultados individuales con nombre si el usuario usa alias.
- Puedo exportar el reporte a PDF o CSV.

**HU20 – Navegar por voz.** Como usuario con movilidad reducida, quiero dar comandos de voz, para usar la app sin tocar la pantalla.
- Los comandos "reportar", "repetir", "pista", "siguiente" y "colgar" funcionan en las pantallas de combate.
- Se muestra en pantalla el comando reconocido como confirmación.

**HU21 – Pedir pista.** Como colaborador indeciso, quiero pedir una pista, para no quedarme trabado.
- Hay máximo 2 pistas por escenario; cada una descuenta 10 puntos.
- La pista orienta ("mira el dominio") pero no da la respuesta.

**HU22 – Jugar sin conexión.** Como recepcionista que usa el celular en el metro, quiero hacer combates sin internet, para aprovechar el tiempo.
- Los 15 escenarios del banco se guardan en caché tras la primera sesión.
- El progreso offline se sincroniza al reconectar sin duplicar puntos.

**HU23 – Cambiar proveedor de LLM (técnica).** Como equipo de desarrollo, queremos cambiar de proveedor de LLM con una variable de entorno, para no depender de uno solo.
- `LLM_PROVIDER=anthropic|openai|ollama` cambia el proveedor sin modificar el código de negocio.
- Las pruebas del gateway pasan con al menos 2 proveedores.

**HU24 – Exportar mi progreso.** Como colaborador, quiero descargar mi progreso, para tener constancia de mi capacitación.
- Puedo exportar un PDF con cinturón, combates realizados y fecha.
