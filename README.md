# CyberDojo

Entrenamiento en ciberseguridad con ataques simulados por voz y chat, adaptado al rol de cada empleado.

Proyecto del curso CC451 Interacción Humano Computador (UNI, 2026-2), grupo 15.

## Qué es

Los empleados de una empresa aprenden a reconocer phishing, vishing e ingeniería social practicando con ataques simulados en un dojo, en lugar de ver una presentación anual que nadie recuerda. Cada ataque se adapta al rol (contador, desarrollador, recepción) y a los puntos débiles de cada persona. Cuando alguien cae, recibe retroalimentación sin culpa y con humor. El progreso se ve en cinturones y en torneos por equipos. Lo que hace no convencional a la interfaz es que gran parte del entrenamiento ocurre por voz: suena el teléfono, una voz sintética intenta sacarte un código y tú respondes hablando.

Todo debe poder usarlo también una persona con discapacidad visual, auditiva, motriz o del habla, o con ansiedad o sobrecarga cognitiva, porque los atacantes no eligen a quién llamar.

El MVP son 15 escenarios (3 roles + escenarios generales, 4 de ellos por voz), evaluación de progreso, perfil adaptativo, salas y torneos por equipos y un panel básico para el administrador, con datos de empleados simulados.

## Cómo cumple el marco común del proyecto

| Requisito | En CyberDojo |
| --- | --- |
| Interfaz de voz | Llamadas de vishing con TTS + STT, comandos de voz para navegar y sensei que narra el debrief. Siempre hay subtítulos y respuesta por botones o texto. |
| LLM | Generación y evaluación de escenarios por rol detrás de una capa de abstracción en `src/llm/gateway.js` + `providers.js`, con fallback al banco de escenarios y guardrails de contenido. El proveedor se cambia por `.env` (`LLM_PROVIDER`: anthropic, openai, ollama local o mock). |
| Plataforma | PWA instalable en laptop y celular, con los escenarios del banco en caché para jugar sin conexión. |
| Personalización continua | Perfil con aciertos y errores por táctica, ritmo, nivel de humor y check-in emocional. La dificultad se recalcula después de cada combate. |
| Multiusuario | Salas por código o QR, torneos por equipos y tablero de cinturones en tiempo real. |
| Diseño emocional (Norman) | Visceral: estética de dojo y sensei. Conductual: feedback inmediato y micro-interacciones. Reflexivo: cinturones, identidad de "guardián" del equipo y tono sin culpa. |
| Licencia | `LICENSE` MIT en la raíz del repositorio. |

## Estado (PC02)

| Parte | Estado |
| --- | --- |
| Análisis (stakeholders, PACT, RF/RNF, HU, matriz, usabilidad) | Listo: en `docs/` y en el informe `docs/informe-pc02.md` |
| Prototipo de fidelidad media (PWA navegable, 15 pantallas) | Listo: `app/` |
| Banco de 15 escenarios simulados | Listo: `data/escenarios.json` |
| Capa de abstracción LLM (gateway + fallback + guardrails) | En curso: esqueleto en `src/llm/` |
| Backend, base de datos y torneos en tiempo real | Pendiente: Sprints 1–4 |

## Privacidad y contenido seguro

- Todas las empresas, personas y dominios son ficticios. Los enlaces usan el TLD reservado `.test`, así que ninguno funciona.
- El audio de las llamadas no se guarda; solo la transcripción si el usuario acepta.
- El check-in emocional nunca se muestra de forma individual al administrador.
- Las API keys del LLM viven solo en el backend (`.env`), nunca en el cliente.

## Equipo y responsabilidades

| Integrante | GitHub | Módulos | Documentos |
| --- | --- | --- | --- |
| Esau Flores Villar | [@FloresVillar](https://github.com/FloresVillar) | `src/llm/` | Stakeholders, requerimientos, historias de usuario, matriz de trazabilidad, criterios de usabilidad, Gantt, arquitectura C4 |
| Junior Ortega Turpo | [@Junior-75](https://github.com/Junior-75) | `src/voice/`, `data/` | PACT, sistemas similares, alternativas de diseño |
| Elmer Izarra Choque | pendiente | `app/` (PWA) | — |

## Cómo trabajamos

- `main` tiene solo versiones revisadas; nadie trabaja directo en ella.
- `dev` es la rama de integración. Cada integrante crea su rama desde `dev` (por ejemplo `feat/voz-vishing` o `docs/pact`) y la vuelve a unir con un PR hacia `dev`.
- Cada tarea es un issue del tablero del proyecto (GitHub Projects), asignado a una persona. El PR que la resuelve dice `closes #N`.
- Cuando `dev` está estable, se abre un PR de `dev` a `main`.
- Después de clonar, cada integrante activa el hook del repo con `git config core.hooksPath .githooks`. Antes de cada push, el hook trae `origin/dev` y cancela el push si tu rama no tiene todos sus commits; en ese caso haz `git pull origin dev` y vuelve a intentar.

## Documentación

| | |
| --- | --- |
| [Stakeholders](docs/01-stakeholders.md) | [Sistemas similares](docs/informe-pc02.md#6-análisis-comparativo) |
| [Análisis PACT](docs/informe-pc02.md#3-análisis-pact) | [Criterios de usabilidad](docs/07-criterios-usabilidad.md) |
| [Requerimientos](docs/03-requerimientos.md) | [Alternativas de diseño](docs/informe-pc02.md#8-alternativas-de-diseño) |
| [Historias de usuario](docs/04-historias-usuario.md) | [Diagrama de Gantt](docs/09-gantt.md) |
| [Matriz de trazabilidad](docs/05-matriz-trazabilidad.md) | [Arquitectura C4](docs/arquitectura-c4.md) |
| [Flujo de pantallas](docs/10-flujo-pantallas.md) | [Simulación del flujo](docs/11-simulacion-flujo.md) |
| [Informe completo PC02](docs/informe-pc02.md) | [Guía de instalación](docs/instalacion.md) |

Las imágenes del diseño (flujo de pantallas, prototipo, alternativas, C4 y Gantt) están en [`docs/img/`](docs/img/) y sus fuentes en [`docs/diagramas/`](docs/diagramas/).

## Estructura

```
app/       prototipo PWA (index.html, manifest, service worker, escenarios.js)
data/      datos simulados: escenarios, usuarios y salas
docs/      documentación (un archivo por punto evaluado), arquitectura-c4.md, instalacion.md
  diagramas/  fuentes .dot, Gantt (Python) y bocetos de alternativas
  img/        diagramas renderizados y capturas del prototipo
src/
  llm/     gateway, adaptadores, guardrails y demo
  voice/   envoltorio de Web Speech API
scripts/   utilidades (regenerar app/escenarios.js)
```

## Instalación

```bash
git clone https://github.com/FloresVillar/cc451-IHC-grupo15-cyberdojo.git
cd cc451-IHC-grupo15-cyberdojo
npm start            # sirve el proyecto en http://localhost:8080
# abrir http://localhost:8080/app/
```

También se puede abrir `app/index.html` directamente con doble clic (sin service worker). Para la llamada de vishing con voz usar Chrome o Edge y permitir el micrófono; si el navegador no tiene reconocimiento de voz, se responde con botones o texto.

Atajos para la demo: la barra superior permite saltar a cualquier pantalla (P01–P15) y reiniciar el perfil. También se puede abrir `app/index.html#P08` para ir directo a una pantalla.

Guía completa: [docs/instalacion.md](docs/instalacion.md).

## Licencia

[MIT](LICENSE).
