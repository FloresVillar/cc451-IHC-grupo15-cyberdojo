// Retroalimentación afectiva y micro-interacciones (diseño emocional de Norman).
//  - Visceral: gong al acertar, timbre de teléfono, confeti al subir de cinturón.
//  - Conductual: vibración corta al reportar, sonido suave (no castigador) al caer, clic al inspeccionar.
// Todo respeta las preferencias del usuario (sonidos) y prefers-reduced-motion.
(function (g) {
  let ctx = null;
  const audio = () => {
    if (!ctx) { const A = g.AudioContext || g.webkitAudioContext; if (!A) return null; ctx = new A(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const menosMovimiento = () => g.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tono(frec, dur, { tipo = 'sine', vol = 0.18, cuando = 0, desliza = null } = {}) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), gn = a.createGain();
    const t = a.currentTime + cuando;
    o.type = tipo; o.frequency.setValueAtTime(frec, t);
    if (desliza) o.frequency.exponentialRampToValueAtTime(desliza, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }

  let timbre = null;
  const EMO = {
    activo: true,
    gong() { if (!EMO.activo) return; tono(196, 1.6, { vol: 0.22 }); tono(392, 1.2, { vol: 0.08, cuando: 0.01 }); tono(587, 0.8, { vol: 0.04 }); },
    suave() { if (!EMO.activo) return; tono(440, 0.25, { vol: 0.1 }); tono(349, 0.45, { vol: 0.1, cuando: 0.18 }); },
    clic() { if (!EMO.activo) return; tono(1200, 0.05, { tipo: 'triangle', vol: 0.06 }); },
    sello() { if (!EMO.activo) return; tono(150, 0.12, { tipo: 'square', vol: 0.05, desliza: 80 }); },
    subida() { if (!EMO.activo) return; [523, 659, 784, 1046].forEach((f, i) => tono(f, 0.35, { vol: 0.12, cuando: i * 0.12 })); },
    vibrar(patron = 40) { try { navigator.vibrate && navigator.vibrate(patron); } catch (e) { /* nada */ } },

    timbreLlamada(on) {
      clearInterval(timbre); timbre = null;
      if (!on) return;
      const sonar = () => { if (!EMO.activo) return; tono(480, 0.4, { vol: 0.12 }); tono(620, 0.4, { vol: 0.08 }); tono(480, 0.4, { vol: 0.12, cuando: 0.5 }); tono(620, 0.4, { vol: 0.08, cuando: 0.5 }); EMO.vibrar([300, 200, 300]); };
      sonar(); timbre = setInterval(sonar, 2400);
    },

    confeti(contenedor) {
      if (menosMovimiento() || !contenedor) return;
      const colores = ['#b53a22', '#f2c94c', '#4f9a5a', '#2f6fb0', '#f2994a'];
      for (let i = 0; i < 40; i++) {
        const p = document.createElement('i');
        p.className = 'confeti';
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colores[i % colores.length];
        p.style.animationDelay = Math.random() * 0.4 + 's';
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
        contenedor.appendChild(p);
        setTimeout(() => p.remove(), 2200);
      }
    },
  };
  g.EMO = EMO;
})(window);
