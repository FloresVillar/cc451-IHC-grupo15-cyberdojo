# CyberDojo v0.3 · Cómo ejecutar (PC03 · Grupo 15)

Guía paso a paso. Los pasos **1 a 5** son obligatorios y bastan para usar la app.
Los pasos **6 a 11** son opcionales y sirven para probar cada característica.
Versión extendida: `cc451-IHC-grupo15-cyberdojo/docs/instalacion.md`.

---

## Requisitos

| | Necesario | Cómo comprobarlo |
|---|---|---|
| Node.js | 18.17 o superior (probado con 20 y 22) | `node -v` |
| npm | Viene con Node.js | `npm -v` |
| Navegador | Chrome o Edge (para usar el micrófono) | — |
| Internet | Solo para `npm install` y para un LLM remoto | — |

Firefox y Safari también abren la app, pero sin reconocimiento de voz: se responde con botones o texto.

---

## Paso 1 · Instalar Node.js

1. Entra a <https://nodejs.org> y descarga la versión **LTS**.
2. Instálala con las opciones por defecto.
3. Abre una terminal **nueva** (PowerShell o CMD en Windows) y ejecuta:

   ```bash
   node -v
   npm -v
   ```

   ✅ Debe mostrar algo como `v20.x.x` (o mayor que 18.17) y un número de versión de npm.

## Paso 2 · Abrir la carpeta del proyecto

1. Descomprime el `.zip` de la entrega (si aún no lo hiciste).
2. En la terminal, entra a la carpeta del proyecto:

   ```bash
   cd ruta\a\CC451-PC03-Proy-Esau_Flores\cc451-IHC-grupo15-cyberdojo
   ```

   Atajo en Windows: abre la carpeta `cc451-IHC-grupo15-cyberdojo` en el Explorador, escribe `cmd` en la barra de direcciones y pulsa Enter.

   ✅ Si ejecutas `dir` (Windows) o `ls` (Linux/Mac) debes ver `package.json`, `app`, `src`, `data`, `docs`.

## Paso 3 · Instalar dependencias

```bash
npm install
```

✅ Termina con un mensaje como `added N packages`. Solo instala `qrcode` (opcional).
Si falla por falta de internet, continúa igual: todo funciona salvo la imagen del QR.

## Paso 4 · Levantar el servidor

```bash
npm start
```

✅ La consola debe mostrar:

```
  CyberDojo v0.3 listo
  ➜ En esta laptop:   http://localhost:8080/app/
  ➜ En tu celular:    http://192.168.x.x:8080/app/  (misma red Wi-Fi)
  LLM: mock (sin IA: banco de escenarios y reglas; configura .env para usar un LLM)
```

**No cierres esta terminal**: el servidor funciona mientras esté abierta. Para detenerlo, `Ctrl + C`.

## Paso 5 · Abrir la app e ingresar

1. Abre **Chrome o Edge** en <http://localhost:8080/app/>.
2. Haz un clic en la página y, cuando lo pida, **permite el micrófono**.
3. Ingresa con un usuario de la demo (no hay contraseña):

   | Correo | Rol | Para qué sirve |
   |---|---|---|
   | `rosa.quispe@kallpa.test` | Contadora, Finanzas | Flujo principal (usar este primero) |
   | `diego.ramirez@kallpa.test` | Desarrollador, TI | Segundo usuario para el multiusuario |
   | `milagros.torres@kallpa.test` | Recepción, Operaciones | Escenarios presenciales |
   | `javier.huaman@kallpa.test` | Administrador | Panel de administración (botón "Soy administrador") |
   | cualquier correo nuevo | — | Recorre el onboarding completo |

4. Código de organización: `KALLPA` (o déjalo vacío).

✅ Entras al Dojo y puedes iniciar un combate. **Con esto la app ya está funcionando.**

---

## Paso 6 · (Opcional) Probar el modo multiusuario

1. Ventana normal: ingresa como **Rosa** (`rosa.quispe@kallpa.test`).
2. Abre una ventana **de incógnito** (`Ctrl + Shift + N`) en la misma dirección e ingresa como **Diego** (`diego.ramirez@kallpa.test`).
3. En ambas ventanas: **Salas** → verás "2 conectados" → **Entrar al torneo**.
4. Juega un combate en una ventana.

✅ El marcador se actualiza al instante en la otra ventana. Además, en modo demo otros equipos suman puntos simulados cada pocos segundos.

## Paso 7 · (Opcional) Probar el modo sin conexión

1. Con la app abierta en Chrome: `F12` → pestaña **Network** → cambia "No throttling" por **Offline**.
2. Juega un combate. ✅ El Dojo muestra "⏳ 1 combate(s) guardados sin conexión. Se enviarán al reconectar."
3. Vuelve a **No throttling** (online). ✅ Aparece "Conexión recuperada: 1 combate(s) sincronizados" y los puntos se suman una sola vez.

## Paso 8 · (Opcional) Conectar un LLM real

Sin configurar nada, la app usa el modo `mock` (banco de escenarios y reglas). Para usar IA:

1. Detén el servidor (`Ctrl + C`).
2. Crea el archivo `.env` a partir del ejemplo:

   ```bash
   copy .env.example .env      # Windows (CMD o PowerShell)
   cp .env.example .env        # Linux / Mac / Git Bash
   ```

3. Abre `.env` con un editor de texto y completa **una** opción:

   | Opción | Líneas a cambiar en `.env` |
   |---|---|
   | Google Gemini (capa gratuita) | `LLM_PROVIDER=gemini` y `GEMINI_API_KEY=tu_clave` |
   | Anthropic | `LLM_PROVIDER=anthropic` y `ANTHROPIC_API_KEY=tu_clave` |
   | OpenAI | `LLM_PROVIDER=openai` y `OPENAI_API_KEY=tu_clave` |
   | Groq / OpenRouter | `LLM_PROVIDER=openai`, `OPENAI_BASE_URL=https://api.groq.com/openai/v1`, `OPENAI_API_KEY=tu_clave`, `LLM_MODEL=llama-3.1-8b-instant` |
   | Ollama (local, sin internet) | Instala [Ollama](https://ollama.com), ejecuta `ollama pull llama3.1`, y pon `LLM_PROVIDER=ollama` y `LLM_TIMEOUT_MS=15000` |

4. Comprueba que el LLM responde:

   ```bash
   npm run demo:llm
   ```

5. Vuelve a levantar el servidor con `npm start`.

✅ La consola ya no dice `LLM: mock`. En la pantalla de combates aparece "✨ Combate nuevo generado por IA" y el sensei responde con IA.

## Paso 9 · (Opcional) Probar desde el celular

Los navegadores solo dejan usar el micrófono en HTTPS, así que el celular se conecta por un túnel de Cloudflare: gratis, sin cuenta, sin tocar el firewall y sin importar la red del celular.

### Pasos

1. **Instalar una vez** (PowerShell normal): `winget install --id Cloudflare.cloudflared`
2. Si después dice que `cloudflared` no se reconoce, actualiza la lista de programas de esa terminal:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```
   (o cierra PowerShell y ábrelo de nuevo).
3. Deja corriendo `npm start` en su terminal.
4. En una **segunda terminal** ejecuta:
   ```powershell
   cloudflared tunnel --url http://127.0.0.1:8080
   ```
5. Copia la dirección que aparece, parecida a `https://algo-random.trycloudflare.com`.
6. Ábrela en el celular **agregando `/app/`** al final (`https://algo-random.trycloudflare.com/app/`) y permite el micrófono cuando lo pida.

✅ La app carga en el celular y el botón 🎙️ responde.

- Mantén abiertas las dos terminales mientras pruebas. Si cierras la del túnel, la dirección deja de funcionar y la próxima vez será otra.
- Evita `npx localtunnel`: pide una contraseña (la IP pública) que con algunas conexiones nunca es aceptada ("endpoint IP is not correct") y puede dar "Bad Gateway".

### Instalarla como app

Chrome Android → menú ⋮ → **Instalar app**. iPhone (Safari) → Compartir → **Agregar a inicio**.

### Problemas del celular

| Problema | Solución |
|---|---|
| "Bad Gateway" en el túnel | El servidor no está encendido o el túnel apunta a otro puerto. Revisa que `npm start` siga abierto y usa `http://127.0.0.1:8080`. |
| `EADDRINUSE: address already in use 0.0.0.0:8080` al hacer `npm start` | Ya hay otro servidor en 8080. Busca su número: `netstat -ano \| findstr :8080` y ciérralo: `taskkill /PID <número> /F`. O usa otro puerto: `$env:PORT=3000; npm start`. |
| El micrófono no responde en el celular | Debes entrar por la dirección `https://…` del túnel, y dar permiso de micrófono al sitio. |

## Paso 10 · (Opcional) Ejecutar las pruebas automáticas

Con el servidor detenido o en otra terminal (dentro de `cc451-IHC-grupo15-cyberdojo`):

```bash
npm test
```

✅ Debe terminar con `# tests 25` y `# pass 25`.

## Paso 11 · (Opcional) Reiniciar los datos de la demo

```bash
npm run reset
```

Y en el navegador, botón **"Reiniciar demo"** de la barra superior.

---

## Resumen de comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (paso 3) |
| `npm start` | Levanta el servidor en `http://localhost:8080` (paso 4) |
| `npm run dev` | Igual que `start`, pero se reinicia al guardar cambios |
| `npm test` | Ejecuta las 25 pruebas automáticas |
| `npm run demo:llm` | Prueba la conexión con el LLM por consola |
| `npm run reset` | Borra la base local y vuelve a los datos simulados |

## Problemas comunes

| Problema | Solución |
|---|---|
| `node` o `npm` "no se reconoce como comando" | Cierra y vuelve a abrir la terminal después de instalar Node.js. Si persiste, reinicia el equipo. |
| El puerto 8080 está en uso | PowerShell: `$env:PORT=3000; npm start` · CMD: `set PORT=3000 && npm start` · Linux/Mac: `PORT=3000 npm start`. Luego abre `http://localhost:3000/app/`. |
| La página no carga | Revisa que la terminal con `npm start` siga abierta y que la URL termine en `/app/`. |
| No se escucha la voz | Activa "Usar voz" en Ajustes y haz un clic en la página (los navegadores bloquean el audio sin interacción). |
| El micrófono no responde | Da permiso de micrófono al sitio (ícono del candado en la barra de direcciones). Usa Chrome o Edge. Mientras tanto, responde con botones o texto. |
| "Combate generado por IA" usa el banco | El proveedor sigue en `mock` o el LLM no respondió a tiempo. Revisa `.env` y la salida de `npm run demo:llm`. |
| "Sesión vencida" | Cierra sesión en Ajustes y vuelve a ingresar. |

---

Informe de la entrega: `informe-pc03.pdf`.
