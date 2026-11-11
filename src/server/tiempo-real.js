// Tiempo real con Server-Sent Events (RF14, RF15, RNF09). Cada sala tiene sus conexiones abiertas;
// cuando cambia el marcador o entra alguien, se envía el evento a todos los dispositivos de la sala.
// SSE funciona sobre HTTP normal, sin librerías, y el navegador reconecta solo si se cae la red.
export function crearHub() {
  const salas = new Map(); // codigo -> Set<{res, usuarioId}>

  function enviar(res, evento, datos) {
    res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`);
  }

  const latido = setInterval(() => {
    for (const set of salas.values()) for (const c of set) c.res.write(': latido\n\n');
  }, 25000);
  latido.unref();

  return {
    suscribir(codigo, usuarioId, req, res, alConectar) {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      res.write('retry: 3000\n\n');
      const c = { res, usuarioId };
      if (!salas.has(codigo)) salas.set(codigo, new Set());
      salas.get(codigo).add(c);
      alConectar && alConectar();
      req.on('close', () => {
        salas.get(codigo)?.delete(c);
        alConectar && alConectar();
      });
    },
    emitir(codigo, evento, datos) {
      for (const c of salas.get(codigo) || []) enviar(c.res, evento, datos);
    },
    conectados(codigo) {
      return new Set([...(salas.get(codigo) || [])].map(c => c.usuarioId));
    },
    cerrar() { clearInterval(latido); for (const set of salas.values()) for (const c of set) c.res.end(); salas.clear(); },
  };
}
