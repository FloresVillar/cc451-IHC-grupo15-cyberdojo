# CyberDojo

Entrenamiento en ciberseguridad con ataques simulados por voz y chat, adaptado al rol de cada empleado.

Proyecto del curso CC451 Interacción Humano Computador (UNI, 2026-2), grupo 15.

## Qué es

Los empleados de una empresa aprenden a reconocer phishing, vishing e ingeniería social practicando con ataques simulados en un dojo, en lugar de ver una presentación anual que nadie recuerda. Cada ataque se adapta al rol (contador, desarrollador, recepción) y a los puntos débiles de cada persona. Cuando alguien cae, recibe retroalimentación sin culpa y con humor. El progreso se ve en cinturones y en torneos por equipos, y una constelación 3D de senseis históricos sirve de módulo de aprendizaje.

Todo debe poder usarlo también una persona ciega, sorda, con discapacidad motriz o neurodivergente, porque los atacantes no eligen a quién llamar.

El MVP son 15 escenarios simulados (5 por rol) y la evaluación de progreso, con datos de empleados simulados.

## Cómo cumple el marco común del proyecto

| Requisito | En CyberDojo |
| --- | --- |
| Interfaz de voz | Llamadas de vishing simuladas con TTS; el empleado responde por voz (Web Speech API). Siempre se muestra lo que se entendió y hay botones como alternativa. |
| LLM | Generación de escenarios por rol y senseis, detrás de una capa de proveedor (Gemini, Groq, Ollama) en `src/llm/`. |
| Plataforma | PWA: celular o computadora, y se puede reanudar un escenario sin conexión. |
| Personalización continua | Perfil persistente con errores por tipo de ataque, tiempos de respuesta y temas, que ajusta la dificultad. |
| Multiusuario | Torneos por equipos y tablero de cinturones en tiempo real. |
| Diseño emocional | Visceral: el dojo nocturno, los cinturones y los halos de los senseis. Conductual: retroalimentación inmediata, corta y sin culpa. Reflexivo: el empleado se ve mejorar y aprende de personas reales que vivieron esos ataques. |

## Equipo y responsabilidades

| Integrante | GitHub | Módulos | Documentos |
| --- | --- | --- | --- |
| Esau Flores Villar | [@FloresVillar](https://github.com/FloresVillar) | `src/llm/`, `src/constelacion/` | Requerimientos, historias de usuario, matriz de trazabilidad, criterios de usabilidad |
| Junior Ortega Turpo | [@Junior-75](https://github.com/Junior-75) | `src/voz/`, `src/escenarios/` | PACT, sistemas similares, alternativas de diseño |
| Elmer Izarra Choque | pendiente | `src/multiusuario/`, `src/perfil/`, `public/` (PWA) | Stakeholders y entrevistas, Gantt, arquitectura C4 |

## Cómo trabajamos

- `main` tiene solo versiones revisadas; nadie trabaja directo en ella.
- `dev` es la rama de integración. Cada integrante crea su rama desde `dev` (por ejemplo `feat/voz-vishing` o `docs/pact`) y la vuelve a unir con un PR hacia `dev`.
- Cada tarea es un issue del tablero del proyecto (GitHub Projects), asignado a una persona. El PR que la resuelve dice `closes #N`.
- Cuando `dev` está estable, se abre un PR de `dev` a `main`.

## Documentación

| | |
| --- | --- |
| [Stakeholders](docs/01-stakeholders.md) | [Sistemas similares](docs/06-sistemas-similares.md) |
| [Análisis PACT](docs/02-pact.md) | [Criterios de usabilidad](docs/07-criterios-usabilidad.md) |
| [Requerimientos](docs/03-requerimientos.md) | [Alternativas de diseño](docs/08-alternativas-diseno.md) |
| [Historias de usuario](docs/04-historias-usuario.md) | [Diagrama de Gantt](docs/09-gantt.md) |
| [Matriz de trazabilidad](docs/05-matriz-trazabilidad.md) | [Arquitectura C4](docs/arquitectura/) |

El diseño (flujo de pantallas, prototipo y alternativas) está en [`docs/diseno/`](docs/diseno/).

## Estructura

```
docs/      documentación del proyecto (un archivo por punto evaluado)
public/    manifest, service worker e íconos de la PWA
src/       código de la aplicación, un módulo por carpeta
data/      datos simulados: escenarios, empleados ficticios y senseis
tests/     pruebas con Playwright (accesibilidad, teclado y flujos)
```

## Instalación

Ver [INSTALL.md](INSTALL.md).

## Licencia

[MIT](LICENSE).
