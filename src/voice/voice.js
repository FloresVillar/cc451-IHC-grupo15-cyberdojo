// Envoltorio de voz para el cliente (RF06, RF07, RF19). Usa Web Speech API y cae a texto si no existe.
export const voz = {
  disponibleTTS: () => 'speechSynthesis' in window,
  disponibleSTT: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),

  hablar(texto, { lang = 'es-PE', rate = 1 } = {}) {
    return new Promise(res => {
      if (!this.disponibleTTS()) return res();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = lang; u.rate = rate;
      const v = speechSynthesis.getVoices().find(v => v.lang?.startsWith('es'));
      if (v) u.voice = v;
      u.onend = u.onerror = () => res();
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
  },

  escuchar({ lang = 'es-PE' } = {}) {
    return new Promise((res, rej) => {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return rej(new Error('STT no disponible: usar respuesta escrita'));
      const r = new R(); r.lang = lang; r.interimResults = false;
      r.onresult = e => res(e.results[0][0].transcript);
      r.onerror = e => rej(new Error(e.error));
      r.start();
    });
  },

  // Comandos globales: "reportar", "repetir", "pista", "siguiente", "colgar"
  interpretarComando(texto) {
    const t = texto.toLowerCase();
    return ['reportar', 'repetir', 'pista', 'siguiente', 'colgar', 'verificar'].find(c => t.includes(c.slice(0, 6))) || null;
  },
};
