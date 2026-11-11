# Guía de instalación y ejecución (v0.3)

## Requisitos

| | Mínimo | Notas |
|---|---|---|
| Node.js | 18.17 o superior (probado con 22) | <https://nodejs.org> → versión LTS. Comprueba con `node -v`. |
| Navegador | Chrome o Edge | Para reconocer voz. Firefox y Safari funcionan, pero sin reconocimiento de voz: se responde con botones o texto. |
| Equipo | Laptop con 4 GB de RAM o celular Android/iOS | No necesita GPU, salvo que uses un modelo local con Ollama. |
| Internet | Opcional | Solo para usar un LLM remoto. Sin internet funciona con el banco de escenarios. |

## 1. Obtener el código

```bash
git clone https://github.com/FloresVillar/cc451-IHC-grupo15-cyberdojo.git
cd cc451-IHC-grupo15-cyberdojo
```

O descomprime el `.zip` de la entrega y entra a la carpeta `cc451-IHC-grupo15-cyberdojo`.

## 2. Instalar y levantar

```bash
npm install        # instala la única dependencia (qrcode, opcional)
npm start          # levanta el servidor
```

La consola muestra:

```
  CyberDojo v0.3 listo
  ➜ En esta laptop:   http://localhost:8080/app/
  ➜ En tu celular:    http://192.168.1.25:8080/app/  (misma red Wi-Fi)
  LLM: mock (sin IA: banco de escenarios y reglas; configura .env para usar un LLM)
```

Abre `http://localhost:8080/app/` en Chrome. Para detener el servidor usa `Ctrl + C`.

> Si `npm install` falla por falta de internet, igual puedes hacer `npm start`: todo funciona menos la imagen del QR (el código de 6 caracteres sigue sirviendo).

## 3. Usuarios de la demo

| Correo | Rol | Para qué sirve |
|---|---|---|
| `rosa.quispe@kallpa.test` | Contadora, equipo Finanzas, usa alias `Ninja_Contable` | Flujo principal. |
| `diego.ramirez@kallpa.test` | Desarrollador, equipo TI | Segundo dispositivo para probar el modo multiusuario. |
| `milagros.torres@kallpa.test` | Recepción, equipo Operaciones | Escenarios presenciales. |
| `javier.huaman@kallpa.test` | Administrador | Panel P15 (botón "Soy administrador"). |
| cualquier correo nuevo | — | Recorre el onboarding completo (rol, calibración). |

Código de organización: `KALLPA` (o dejarlo vacío). La demo no usa contraseñas; en producción se usaría el inicio de sesión corporativo (SSO).

## 4. Conectar un LLM (opcional)

Sin configurar nada, el proveedor es `mock`: los escenarios salen del banco, las respuestas habladas se evalúan por reglas y el sensei responde con un FAQ. Para usar IA:

```bash
cp .env.example .env     # en Windows: copy .env.example .env
```

Edita `.env` con **una** de estas opciones y reinicia `npm start`:

| Opción | Configuración en `.env` |
|---|---|
| Google Gemini (tiene capa gratuita; key en <https://aistudio.google.com/apikey>) | `LLM_PROVIDER=gemini` · `GEMINI_API_KEY=...` (modelo por defecto: `gemini-flash-latest`) |
| Anthropic | `LLM_PROVIDER=anthropic` · `ANTHROPIC_API_KEY=...` |
| OpenAI | `LLM_PROVIDER=openai` · `OPENAI_API_KEY=...` |
| Groq (capa gratuita y muy rápida; key en <https://console.groq.com/keys>) | `LLM_PROVIDER=groq` · `GROQ_API_KEY=...` (modelo por defecto: `llama-3.3-70b-versatile`) |
| OpenRouter / LM Studio (API compatible con OpenAI) | `LLM_PROVIDER=openai` · `OPENAI_BASE_URL=...` · `OPENAI_API_KEY=...` · `LLM_MODEL=...` |
| Modelo local, sin internet | Instala [Ollama](https://ollama.com), ejecuta `ollama pull llama3.1` · `LLM_PROVIDER=ollama` · `LLM_TIMEOUT_MS=60000` |

Comprueba la capa LLM sin abrir la app:

```bash
npm run demo:llm
```

Con un LLM configurado, en P05 aparece "✨ Combate nuevo generado por IA", el sensei (P16) responde con IA y el administrador puede generar borradores en P15 → Escenarios.

## 5. Probar desde el celular

1. Conecta el celular a la misma red Wi-Fi que la laptop.
2. Abre la dirección "En tu celular" que muestra la consola (`http://192.168.x.x:8080/app/`).
3. Para instalarla: en Chrome Android, menú ⋮ → "Instalar app"; en iPhone (Safari), Compartir → "Agregar a inicio".

**Micrófono en el celular:** los navegadores solo permiten el micrófono en HTTPS o en `localhost`. Opciones:

- Túnel temporal con HTTPS: `npx localtunnel --port 8080` (o `cloudflared tunnel --url http://localhost:8080`) y abre la URL `https://…` que te da.
- Certificado propio: genera uno con `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=cyberdojo"` y agrega a `.env` `HTTPS_CERT=cert.pem` y `HTTPS_KEY=key.pem`. El navegador mostrará una advertencia que debes aceptar.
- Sin HTTPS, en el celular se responde con botones o texto (la voz del atacante y del sensei sí suena).

## 6. Probar el modo multiusuario

1. Abre `http://localhost:8080/app/` en una ventana normal e ingresa como Rosa.
2. Abre otra ventana **de incógnito** (o el celular) e ingresa como Diego.
3. En ambas: Salas → verás "2 conectados" → "Entrar al torneo".
4. Juega un combate del torneo en una ventana: el marcador cambia en la otra al instante.

En modo demo (`DEMO=1`, por defecto) el torneo "Copa Kallpa" empieza al iniciar el servidor y otros equipos suman puntos simulados cada pocos segundos, para que el marcador se mueva aunque pruebes solo.

## 7. Probar el modo sin conexión

1. Con la app abierta, en Chrome: F12 → pestaña Network → "Offline" (o apaga el Wi-Fi).
2. Juega un combate: el Dojo muestra "1 combate guardado sin conexión".
3. Vuelve a "Online": aparece "Conexión recuperada: 1 combate sincronizado" y los puntos se suman una sola vez.

También se puede abrir `app/index.html` con doble clic (sin servidor): funciona el entrenamiento individual con el banco local.

## 8. Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor en `http://localhost:8080` |
| `npm run dev` | Igual, pero se reinicia al guardar cambios |
| `npm test` | 26 pruebas automáticas (LLM, guardrails, reglas, API, SSE) |
| `npm run demo:llm` | Prueba la capa LLM por consola |
| `npm run reset` | Borra la base local y vuelve a los datos simulados |
| `npm run simulados` | Regenera usuarios y combates simulados |
| `npm run datos` | Regenera `app/escenarios.js` después de editar `data/escenarios.json` |

Variables de `.env`: `PORT`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_TIMEOUT_MS`, claves de cada proveedor, `OPENAI_BASE_URL`, `OLLAMA_URL`, `JWT_SECRET`, `ORG_CODE`, `DEMO`, `DB_FILE`, `HTTPS_CERT`, `HTTPS_KEY`, `RATE_LIMIT`, `RATE_LIMIT_LLM`.

## 9. Regenerar diagramas

```bash
dot -Tpng docs/diagramas/c4-contexto.dot -o docs/img/c4-contexto.png
dot -Tpng docs/diagramas/c4-contenedores.dot -o docs/img/c4-contenedores.png
dot -Tpng docs/diagramas/c4-componentes.dot -o docs/img/c4-componentes.png
dot -Tpng docs/diagramas/interacciones.dot -o docs/img/interacciones.png
python docs/diagramas/gantt.py
```

## Problemas comunes

| Problema | Solución |
|---|---|
| `npm start` dice que el puerto está en uso | Usa otro puerto: `PORT=3000 npm start` (Windows PowerShell: `$env:PORT=3000; npm start`). |
| La llamada no suena | Revisa que "Usar voz" esté activo en Ajustes y que el navegador no esté silenciado. Haz un clic en la página antes (los navegadores bloquean el audio sin interacción). |
| El micrófono no responde | Da permiso de micrófono al sitio. En el celular necesitas HTTPS (sección 5). Mientras tanto usa las respuestas rápidas o el campo de texto. |
| El botón "Combate generado por IA" usa el banco | El aviso de la app y la consola del servidor (`[LLM] ...`) muestran el motivo exacto. Ejecuta `npm run demo:llm`: `HTTP 401` = API key mal copiada; `HTTP 404` = el modelo ya no existe (cambia `LLM_MODEL`); `HTTP 429` = límite de uso; `timeout` = sube `LLM_TIMEOUT_MS`. |
| Cambié `.env` y no pasa nada | El archivo debe llamarse exactamente `.env` (no `.env.txt`), estar en la carpeta raíz junto a `package.json`, y hay que detener (`Ctrl + C`) y volver a ejecutar `npm start`. Al iniciar, la consola dice "Archivo .env: cargado" y el proveedor elegido. |
| "Sesión vencida" | El token dura 1 hora; la app lo renueva sola. Si persiste, cierra sesión en Ajustes. |
| Quiero empezar de cero | "Reiniciar demo" en la barra superior (navegador) y `npm run reset` (servidor). |
