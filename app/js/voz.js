// Interfaz de voz de CyberDojo (RF06, RF07, RF19). Usa la Web Speech API del navegador:
//   - TTS (speechSynthesis): voz del atacante en las llamadas y del sensei.
//   - STT (SpeechRecognition): respuestas habladas en llamadas, comandos de voz y preguntas al sensei.
// Si el navegador no tiene STT, la app sigue funcionando con botones y texto (nunca depende solo de la voz).
(function (g) {
  const Rec = g.SpeechRecognition || g.webkitSpeechRecognition;
  let actual = null;
  let ultimoTexto = '';

  const normal = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,]/g, '').trim();

  function vozEspanol(preferida) {
    const voces = g.speechSynthesis ? speechSynthesis.getVoices() : [];
    return voces.find(v => v.lang === 'es-PE') || voces.find(v => v.lang === preferida)
      || voces.find(v => /es[-_](US|MX|419)/.test(v.lang)) || voces.find(v => v.lang && v.lang.startsWith('es'));
  }

  const VOZ = {
    disponibleTTS: () => 'speechSynthesis' in g,
    disponibleSTT: () => !!Rec,
    get ultimo() { return ultimoTexto; },

    /** Habla un texto. Devuelve una promesa que se resuelve al terminar. */
    hablar(texto, { rate = 1, pitch = 1, activo = true } = {}) {
      return new Promise(res => {
        if (!activo || !VOZ.disponibleTTS() || !texto) return setTimeout(res, 250);
        speechSynthesis.cancel();
        ultimoTexto = texto;
        const u = new SpeechSynthesisUtterance(String(texto).replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
        u.lang = 'es-PE'; u.rate = rate; u.pitch = pitch;
        const v = vozEspanol('es-ES'); if (v) u.voice = v;
        let fin = false; const listo = () => { if (!fin) { fin = true; res(); } };
        u.onend = listo; u.onerror = listo;
        setTimeout(listo, 600 + texto.length * 90); // algunos navegadores no disparan onend
        speechSynthesis.speak(u);
      });
    },

    callar() { if (VOZ.disponibleTTS()) speechSynthesis.cancel(); },

    /** Escucha una frase. onParcial recibe el texto mientras se habla (subtítulo en vivo). */
    escuchar({ onParcial } = {}) {
      return new Promise((res, rej) => {
        if (!Rec) return rej(new Error('sin-stt'));
        VOZ.detener();
        VOZ.callar();
        const r = new Rec();
        r.lang = 'es-PE'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
        let final = '';
        r.onresult = e => {
          let parcial = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final += e.results[i][0].transcript; else parcial += e.results[i][0].transcript;
          }
          onParcial && onParcial(final + parcial);
        };
        r.onerror = e => { actual = null; rej(new Error(e.error || 'error')); };
        r.onend = () => { actual = null; final.trim() ? res(final.trim()) : rej(new Error('no-speech')); };
        actual = r;
        try { r.start(); } catch (e) { actual = null; rej(e); }
      });
    },

    detener() { if (actual) { try { actual.abort(); } catch (e) { /* nada */ } actual = null; } },
    escuchando: () => !!actual,

    /**
     * Interpreta un comando de voz. Devuelve {tipo:'nav'|'accion'|'pregunta', ...}.
     * Lo que no es un comando se envía como pregunta al sensei.
     */
    interpretar(texto) {
      const t = normal(texto);
      const nav = [
        [/^(ir a |abrir |ver )?(el )?(dojo|inicio|casa)$/, 'P05'], [/progreso|mis puntos|mi avance/, 'P10'],
        [/^(ir a |abrir )?(las )?salas?$|unirme a (una )?sala/, 'P11'], [/torneo/, 'P12'], [/tablero|ranking|cinturones/, 'P13'],
        [/ajustes|configuracion|preferencias/, 'P14'], [/camino|lista de combates|todos los combates/, 'P06'],
        [/^(hablar con el |abrir el )?sensei$|^ayuda$/, 'P16'], [/administrador|panel admin/, 'P15'],
      ];
      const acciones = [
        [/^reporta(r)?|^(es )?phishing$|bandera roja/, 'reportar'], [/verifica(r)?|otro canal/, 'verificar'],
        [/(es )?legitimo|es normal|es real/, 'legitimo'], [/^pista|dame una pista|ayudame/, 'pista'],
        [/siguiente|otro combate|nuevo combate/, 'siguiente'], [/repet(ir|ime)|otra vez|no escuche/, 'repetir'],
        [/colgar|cuelga|termina(r)? la llamada/, 'colgar'], [/contestar|contesta|aceptar llamada/, 'contestar'],
        [/silencio|callate|para(r)? de hablar/, 'callar'], [/letra (mas )?grande|aumenta(r)? (la )?letra/, 'letra+'],
        [/letra (mas )?(chica|pequena)|reduce la letra/, 'letra-'], [/volver|atras|regresar/, 'volver'],
        [/^(empezar|comenzar|iniciar)( combate)?$/, 'empezar'], [/comandos|que puedo decir/, 'comandos'],
      ];
      for (const [re, a] of acciones) if (re.test(t)) return { tipo: 'accion', accion: a, texto };
      for (const [re, d] of nav) if (re.test(t)) return { tipo: 'nav', destino: d, texto };
      return { tipo: 'pregunta', texto };
    },
  };

  if (VOZ.disponibleTTS()) speechSynthesis.onvoiceschanged = () => {};
  g.VOZ = VOZ;
})(window);
