# Stakeholders y análisis de usuarios

Nos quedamos solo con los actores sin los cuales el sistema no funciona. Partimos de cómo trabaja cada rol en una pyme típica y de nuestra propia experiencia con capacitaciones obligatorias en prácticas preprofesionales. Las personas de abajo son arquetipos que construimos con esa información.

| Stakeholder | Tipo | Qué necesita | Qué aporta / por qué es indispensable |
| :--- | :--- | :--- | :--- |
| Colaborador-aprendiz (contador, desarrollador, recepción) | Usuario primario | Practicar en poco tiempo, sin sentirse juzgado, con casos que se parezcan a su trabajo real. | Es quien usa la app a diario; sus errores alimentan el perfil adaptativo. |
| Responsable de seguridad / TI de la organización | Usuario secundario (administrador) | Crear salas y torneos, ver si el equipo mejora, revisar los escenarios antes de publicarlos. | Sin él no hay salas, ni torneos, ni validación del contenido que genera el LLM. |
| Proveedor del LLM y de voz (API remota o modelo local) | Stakeholder técnico externo | API key, límites de uso, políticas de contenido. | Genera escenarios y evalúa respuestas. Sus políticas condicionan qué ataques se pueden simular (por eso la capa de abstracción y el banco de respaldo). |

## Personas

**Rosa, 47 años – Contadora (rol contador).** Lleva 20 años en la empresa, maneja transferencias y pagos a proveedores. Usa la computadora todo el día pero desconfía de las "apps de juegos". Le preocupa equivocarse delante de su jefe. Usa lentes y prefiere letras grandes. Le sirve que la app le hable de facturas, cambios de cuenta y llamadas del banco.

**Diego, 26 años – Desarrollador backend (rol desarrollador).** Siente que ya sabe todo sobre phishing y que la capacitación es pérdida de tiempo. Se engancha con la competencia y los rankings. Su riesgo real está en dependencias falsas, tokens y pedidos de acceso por chat. Si el escenario es muy fácil, abandona.

**Milagros, 31 años – Recepcionista (rol recepción).** Atiende teléfono y visitas al mismo tiempo, siempre con interrupciones. Usa más el celular que la laptop. Su riesgo está en llamadas de "gerentes", visitas sin cita y objetos olvidados. Necesita sesiones cortas (menos de 5 minutos) que pueda pausar.

**Javier, 38 años – Jefe de TI (administrador).** Tiene que reportar a gerencia que "se capacitó al personal". Quiere métricas claras, no 30 gráficos. No tiene tiempo de escribir escenarios, pero sí de revisar los que genera el sistema.

## Diferencias entre usuarios y cómo influyen en el diseño

| Diferencia | Ejemplo | Decisión de diseño |
| :--- | :--- | :--- |
| Rol laboral | Rosa ve facturas; Diego ve repositorios. | El rol se elige al registrarse y el LLM recibe el rol como parámetro. Cada rol tiene escenarios propios + escenarios "para todos". |
| Experiencia previa en seguridad | Diego cree que sabe; Rosa siente que no sabe nada. | Calibración inicial de 3 preguntas. La dificultad arranca en nivel distinto y se ajusta con cada combate. |
| Actitud frente al error | Rosa teme quedar mal; Diego quiere ganar. | Debrief sin culpa y privado. En el tablero público solo se ven cinturones y puntos del equipo, nunca los errores individuales. Opción de alias. |
| Tiempo y dispositivo | Milagros usa el celular entre llamadas. | Diseño mobile-first, combates de 2–4 minutos, progreso guardado si se interrumpe. |
| Entorno (ruido, oficina abierta) | Recepción tiene ruido; en open space no se puede hablar en voz alta. | Toda interacción por voz tiene alternativa en texto (subtítulos + respuesta escrita). |
| Edad y alfabetización digital | Rosa prefiere letra grande y menos íconos sueltos. | Botones con texto + ícono, tamaño de fuente ajustable, nada de gestos ocultos. |

## Usuarios con discapacidad

| Tipo | Barrera que encontramos | Cómo lo resolvemos |
| :--- | :--- | :--- |
| Visual (baja visión o ceguera) | Inspeccionar un correo depende de "ver" el remitente o el enlace. | Elementos inspeccionables como botones reales con etiqueta accesible ("Remitente: r.salas@kallpa-gerencia.test"). Compatibilidad con lectores de pantalla (TalkBack, VoiceOver, NVDA). Contraste mínimo 4.5:1 y fuente escalable al 200%. Las llamadas de vishing son accesibles por naturaleza. |
| Auditiva | Las llamadas de vishing son solo audio. | Subtítulos en vivo de la voz del atacante y respuesta por texto. Las vibraciones/animaciones reemplazan los sonidos de feedback. |
| Motriz | Tocar elementos pequeños, arrastrar. | Objetivos táctiles de 44×44 px mínimo, navegación completa por teclado, comandos de voz ("reportar", "siguiente", "pista"), sin límites de tiempo estrictos (el temporizador del torneo se puede extender). |
| Habla | No poder responder la llamada hablando. | La respuesta escrita cuenta igual que la hablada; no penaliza. |
| Cognitiva / ansiedad | Presión del temporizador, sobrecarga de información. | Modo "práctica sin reloj", textos cortos, un solo objetivo por pantalla, check-in emocional que baja la intensidad si la persona dice que está estresada. |

