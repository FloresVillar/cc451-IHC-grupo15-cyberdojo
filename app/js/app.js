// CyberDojo · PWA (v0.3). Pantallas P01–P16, estado de la sesión y acciones.
// Depende de: escenarios.js (banco local), reglas.js, voz.js, emocion.js y api.js.
/* global REGLAS, VOZ, EMO, API */
'use strict';
const RG = window.REGLAS;
const BELTS = RG.CINTURONES, TAC = RG.TACTICAS;
const CANAL = { correo: '✉️', chat: '💬', sms: '📱', llamada: '📞', presencial: '🚪' };
const ROLES = { contador: 'Contabilidad', desarrollador: 'Desarrollo', recepcion: 'Recepción', otro: 'Otro' };
const SCREENS = [['P01', 'Bienvenida'], ['P02', 'Ingreso'], ['P03', 'Rol y preferencias'], ['P04', 'Calibración'], ['P05', 'Dojo'],
  ['P06', 'Camino de combates'], ['P07', 'Combate'], ['P08', 'Llamada de vishing'], ['P09', 'Debrief'], ['P10', 'Mi progreso'],
  ['P11', 'Salas'], ['P12', 'Torneo'], ['P13', 'Tablero de cinturones'], ['P14', 'Ajustes'], ['P15', 'Panel administrador'], ['P16', 'Sensei por voz']];
const SIN_NAV = ['P01', 'P02', 'P03', 'P04', 'P07', 'P08', 'P09', 'P12', 'P15'];

let ESC = window.ESCENARIOS.escenarios.slice();
const EXTRA = {}; // escenarios generados por IA para práctica personal
const buscarEsc = id => ESC.find(x => x.id === id) || EXTRA[id];

let U = API.LS.get('cyberdojo_perfil') || RG.perfilVacio();
let S = { screen: 'P01', esc: null, ins: new Set(), hints: 0, turn: -1, result: null, torneo: null, adminTab: 'metricas', boardTab: 'equipos',
  calib: 0, calibOk: 0, t0: 0, lastReply: '', chat: [], senseiEsc: null, sala: null, salas: null, tablero: null, metricas: null,
  adminEsc: null, adminSalas: null, cargando: {}, usoVoz: false, sugerido: null, llm: null, modal: null, parcial: '' };
let cerrarSSE = () => {};
let relojTorneo = null;

/* ---------------- utilidades ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const say = t => { $('#live').textContent = t; };
const belt = (p = U.puntos) => RG.cinturon(p);
const beltTag = i => `<span class="belt"><i style="background:${BELTS[i].c}"></i>Cinturón ${BELTS[i].n}</span>`;
const displayName = () => (U.useAlias && U.alias) ? U.alias : (U.nombre ? U.nombre.split(' ')[0] : (U.email.split('@')[0] || 'Tú'));
const tono = () => RG.tonoSensei(U);
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const hoy = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function guardarLocal() { API.LS.set('cyberdojo_perfil', U); }
function aplicarPerfil(p) { if (!p) return; U = Object.assign(RG.perfilVacio(), p); guardarLocal(); EMO.activo = U.sonidos !== false; }
let tPrefs = null;
function guardarPrefs(campos) {
  Object.assign(U, campos); guardarLocal(); EMO.activo = U.sonidos !== false;
  clearTimeout(tPrefs);
  tPrefs = setTimeout(() => API.tieneSesion() && API.guardarPerfil({ rol: U.rol, alias: U.alias, useAlias: U.useAlias, humor: U.humor, voz: U.voz, subs: U.subs, fs: U.fs, sonidos: U.sonidos, rate: U.rate, nivel: U.nivel, calibrado: U.calibrado }), 400);
}

function toast(msg, tipo = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + tipo; t.textContent = msg;
  $('#toasts').appendChild(t); say(msg);
  setTimeout(() => t.remove(), 3800);
}

function hablar(texto, opciones = {}) {
  return VOZ.hablar(texto, { rate: U.rate || tono().rate, activo: U.voz, ...opciones });
}

/* ---------------- modal accesible (reemplaza confirm/alert) ---------------- */
function modal(titulo, cuerpo, acciones = [{ t: 'Entendido', primary: true }]) {
  S.modal = { titulo, cuerpo, acciones };
  pintarModal();
}
function cerrarModal() { S.modal = null; const m = $('#modal'); m && m.remove(); }
function pintarModal() {
  const viejo = $('#modal'); viejo && viejo.remove();
  if (!S.modal) return;
  const m = document.createElement('div');
  m.className = 'modal'; m.id = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'modal-t');
  m.innerHTML = `<div class="card" style="width:100%"><h3 id="modal-t">${S.modal.titulo}</h3><div>${S.modal.cuerpo}</div>
    ${S.modal.acciones.map((a, i) => `<button class="btn ${a.primary ? 'primary' : a.ghost ? 'ghost' : ''}" data-i="${i}">${a.t}</button>`).join('')}</div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    const a = S.modal.acciones[Number(b.dataset.i)];
    const r = a.fn ? a.fn(m) : null;
    if (r !== false) cerrarModal();
  });
  $('#phone').appendChild(m);
  const f = m.querySelector('input,textarea,button'); f && f.focus();
}

/* ---------------- sensei ---------------- */
function senseiSVG(mood = 'ok', tam = 56) {
  const mouth = mood === 'ok' ? 'M20 36 Q28 42 36 36' : mood === 'hmm' ? 'M21 38 L35 38' : 'M20 39 Q28 34 36 39';
  const ojos = mood === 'feliz' ? '<path d="M17 29 q3 -4 6 0 M33 29 q3 -4 6 0" stroke="#1f1d1a" stroke-width="2" fill="none"/>' : '<circle cx="20" cy="29" r="2.5" fill="#1f1d1a"/><circle cx="36" cy="29" r="2.5" fill="#1f1d1a"/>';
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="#efe2c8" stroke="#1f1d1a" stroke-width="2"/><rect x="4" y="14" width="48" height="7" fill="#b53a22"/><path d="M50 17 l6 6 M50 17 l5 -2" stroke="#b53a22" stroke-width="3"/>${ojos}<path d="${mood === 'feliz' ? 'M19 35 Q28 45 37 35' : mouth}" stroke="#1f1d1a" stroke-width="2" fill="none"/><path d="M14 44 Q28 56 42 44" stroke="#1f1d1a" stroke-width="2" fill="#fff"/></svg>`;
}
const sensei = (text, mood) => `<div class="sensei">${senseiSVG(mood)}<div class="bubble">${text}</div></div>`;

/* ---------------- estructura ---------------- */
function shell(title, body, { back = null, footer = '', nav = false } = {}) {
  return `<header class="top">${back ? `<button class="back" aria-label="Volver" onclick="go('${back}')">←</button>` : ''}<h1>${title}</h1><span class="sid">${S.screen}</span></header>
  <main id="main">${body}</main>${footer}${nav ? navbar() : ''}`;
}
function navbar() {
  const it = [['P05', '🏯', 'Dojo'], ['P10', '📈', 'Progreso'], ['P16', '🧘', 'Sensei'], ['P11', '👥', 'Salas'], ['P14', '⚙️', 'Ajustes']];
  return `<nav class="nav" aria-label="Navegación principal">${it.map(([id, i, l]) => `<button onclick="go('${id}')" ${S.screen === id ? 'aria-current="page"' : ''}><span aria-hidden="true">${i}</span>${l}</button>`).join('')}</nav>`;
}
const offlineCard = () => `<div class="card">${sensei('Esta parte necesita conexión con el servidor. Mientras tanto puedes seguir entrenando: tus combates se guardan y se sincronizan al volver.', 'hmm')}</div>`;

/* ---------------- pantallas ---------------- */
const R = {
P01() {
  return shell('CyberDojo', `
  <div style="text-align:center;margin:26px 0 16px">${senseiSVG('ok', 120)}</div>
  <h2 style="text-align:center">Entrena tu instinto contra los ataques</h2>
  <p class="muted" style="text-align:center">Correos, mensajes y llamadas falsas. Practicas aquí para no caer allá. Sin regaños: si te engañan, el sensei te explica cómo fue.</p>
  <div class="card small">🥋 Combates de 2 a 4 minutos · 📞 Llamadas simuladas por voz · 🧘 Sensei que responde por voz · 👥 Torneos por equipos</div>
  <button class="btn primary" onclick="go('P02')">Empezar</button>
  <button class="btn ghost" onclick="go(API.tieneSesion()||U.email?'P05':'P02')">Ya tengo cuenta</button>
  <p class="small muted" style="text-align:center">🎙️ Puedes usar la voz en cualquier momento con el botón del micrófono.</p>`);
},
P02() {
  return shell('Ingresar', `
  <form onsubmit="event.preventDefault();doLogin()">
  <label for="em"><b>Correo</b></label><input id="em" type="email" required autocomplete="email" placeholder="nombre@empresa.com" value="${esc(U.email || 'rosa.quispe@kallpa.test')}">
  <p></p><label for="org"><b>Código de organización</b></label><input id="org" type="text" value="KALLPA" aria-describedby="orgh">
  <p id="orgh" class="small muted">Te lo da el área de TI. Para la demo: KALLPA. Usuarios de prueba: rosa.quispe@, diego.ramirez@ o milagros.torres@kallpa.test, o cualquier correo nuevo.</p>
  <p id="err" class="small" style="color:var(--bad)" role="alert"></p>
  <button class="btn primary" type="submit" id="btnlogin">Continuar</button></form>`, { back: 'P01' });
},
P03() {
  return shell('Tu rol y preferencias', `
  <label for="nom"><b>¿Cómo te llamamos?</b></label><input id="nom" type="text" value="${esc(U.nombre)}" placeholder="Tu nombre" onchange="guardarPrefs({nombre:this.value});API.guardarPerfil({nombre:this.value})">
  <h3 style="margin-top:16px">¿En qué área trabajas?</h3>
  ${Object.entries(ROLES).map(([k, v]) => `<label class="opt"><input type="radio" name="rol" value="${k}" ${U.rol === k ? 'checked' : ''} onchange="guardarPrefs({rol:this.value})">${v}</label>`).join('')}
  <h3 style="margin-top:16px">Tono del sensei</h3>${humorSeg()}
  <h3 style="margin-top:16px">Voz y accesibilidad</h3>${prefs()}
  <button class="btn primary" onclick="S.calib=0;S.calibOk=0;go('P04')">Siguiente</button>`, { back: 'P02' });
},
P04() {
  const Q = [{ t: 'Correo de "soporte@micr0soft-login.test": "Su cuenta será eliminada hoy, ingrese aquí".', a: true },
    { t: 'Tu jefa te escribe desde su correo de siempre: "Reunión movida a las 3, misma sala".', a: false },
    { t: 'Llamada: "Soy del banco, dígame el código que le llegó por SMS para cancelar un cargo".', a: true }];
  if (S.calib >= 3) {
    if (!U.calibrado) guardarPrefs({ nivel: S.calibOk === 3 ? 3 : S.calibOk === 2 ? 2 : 1, calibrado: true });
    return shell('Calibración', `${sensei(`Listo. Empiezas en <b>nivel ${U.nivel}</b>. Esto no es una nota: solo me ayuda a elegir tus primeros combates.`, 'feliz')}<p></p><button class="btn primary" onclick="go('P05')">Entrar al dojo</button>`);
  }
  const q = Q[S.calib];
  return shell('Calibración', `<p class="small muted">Pregunta ${S.calib + 1} de 3</p><div class="bar" role="progressbar" aria-label="Avance de la calibración" aria-valuenow="${S.calib}" aria-valuemin="0" aria-valuemax="3"><span style="width:${S.calib / 3 * 100}%"></span></div><p></p>
   <div class="card"><b>¿Esto es sospechoso?</b><p>${q.t}</p></div>
   <div class="row"><button class="btn" onclick="calib(${q.a === true})">Sí, sospechoso</button><button class="btn" onclick="calib(${q.a === false})">No, es normal</button></div>
   <button class="btn ghost" onclick="S.calib=3;S.calibOk=0;U.calibrado=false;render()">Saltar calibración</button>`, { back: 'P03' });
},
P05() {
  const b = belt(), nx = BELTS[b + 1], e = S.sugerido && buscarEsc(S.sugerido) || RG.sugerir(U, ESC);
  const pct = nx ? Math.round((U.puntos - BELTS[b].min) / (nx.min - BELTS[b].min) * 100) : 100;
  const weak = RG.tacticasDebiles(U).map(t => TAC[t]);
  const tn = tono();
  const saludo = tn.modoPractica ? `Hoy vamos con calma, ${esc(displayName())}: modo práctica, sin reloj y con voz más pausada.`
    : tn.suave ? `Gracias por contarme cómo estás. Hoy combates más sencillos para entrar en ritmo.`
    : `Hola, ${esc(displayName())}. ${weak.length ? `Hoy toca reforzar: <b>${weak.join(', ')}</b>.` : '¿Listo para un combate?'}`;
  const pend = API.pendientes();
  return shell('Dojo', `
   ${sensei(saludo, 'ok')}
   ${pend ? `<p class="small" style="margin:8px 0">⏳ ${pend} combate(s) guardados sin conexión. Se enviarán al reconectar.</p>` : ''}
   <div class="card" style="margin-top:12px">${beltTag(b)} <span class="muted small">· ${U.puntos} pts · nivel ${U.nivel}</span>
   <div class="bar" style="margin-top:8px" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance al siguiente cinturón"><span style="width:${pct}%"></span></div>
   <p class="small muted">${nx ? `${nx.min - U.puntos} pts para cinturón ${nx.n}` : 'Llegaste al cinturón negro'}</p></div>
   <div class="card"><span class="tag">Combate sugerido</span><span class="tag">${CANAL[e.canal]} ${e.canal}</span>${e.generado ? '<span class="tag ia">✨ IA</span>' : ''}
   <h3>${esc(e.titulo)}</h3><p class="small muted">Dificultad ${'●'.repeat(e.dificultad)}${'○'.repeat(3 - e.dificultad)} · ${e.tacticas.map(t => TAC[t]).join(', ')}</p>
   <button class="btn primary" onclick="start('${e.id}')">Empezar combate</button></div>
   <button class="btn ia" onclick="combateIA()" ${API.enLinea ? '' : 'disabled title="Necesita conexión"'} id="btnia">✨ Combate nuevo generado por IA para mi rol</button>
   <button class="btn" onclick="go('P06')">🗺️ Camino de combates</button>
   <button class="btn" onclick="go('P11')">👥 Salas y torneos</button>
   <button class="btn ghost small" onclick="go('P15')">Soy administrador</button>`, { nav: true });
},
P06() {
  const done = Object.fromEntries(U.hist.map(h => [h.id, h.ok]));
  const lista = RG.escenariosDelRol(U, ESC);
  return shell('Camino de combates', `<p class="small muted">Rol: ${ROLES[U.rol] || U.rol} · ${lista.length} combates</p><div class="list">
   ${lista.map(e => `<button class="item" onclick="start('${e.id}')"><span class="ico" aria-hidden="true">${CANAL[e.canal]}</span><span class="grow"><b>${esc(e.titulo)}</b>${e.generado ? ' <span class="tag ia">✨ IA aprobado</span>' : ''}<br><span class="small muted">${e.canal} · ${'●'.repeat(e.dificultad)}${'○'.repeat(3 - e.dificultad)}</span></span><span aria-label="${e.id in done ? (done[e.id] ? 'superado' : 'por repetir') : 'pendiente'}">${e.id in done ? (done[e.id] ? '✅' : '🔁') : '›'}</span></button>`).join('')}
   </div>`, { back: 'P05', nav: true });
},
P07() {
  const e = S.esc, m = e.mensaje, fromIns = S.ins.has('from');
  const risky = { correo: 'Responder / abrir', chat: 'Hacer lo que pide', sms: 'Abrir el enlace', presencial: 'Hacer lo que pide' }[e.canal];
  const tl = torneoActual();
  return shell(`${CANAL[e.canal]} ${esc(e.titulo)}`, `
   ${tl ? `<p class="small"><span class="tag">🏆 Torneo</span> <span id="tleft2">${fmt(tl.restante_s)}</span></p>` : tono().modoPractica ? '<p class="small"><span class="tag">🌿 Modo práctica · sin reloj</span></p>' : ''}
   ${e.generado ? '<p class="small"><span class="tag ia">✨ Escenario generado por IA para tu rol</span></p>' : ''}
   <p class="small muted">Inspecciona lo que te parezca raro y decide qué harías.</p>
   <div class="card mail">
    <button class="from ${fromIns ? 'ins' : ''}" onclick="inspect('from')">
     <span class="small muted">${e.canal === 'presencial' ? 'Situación' : 'De'}</span><br><b>${esc(m.de)}</b>${fromIns ? ' 🔎' : ''}<span class="sr"> (toca para inspeccionar el remitente)</span></button>
    ${m.asunto ? `<h3 style="margin-top:10px">${esc(m.asunto)}</h3>` : ''}
    <p>${esc(m.cuerpo)}</p>
    ${m.enlaces.map((l, i) => `<button class="chip ${S.ins.has('l' + i) ? 'ins' : ''}" onclick="inspect('l${i}')">🔗 ${S.ins.has('l' + i) ? 'Enlace inspeccionado' : 'Ver enlace'}</button>${S.ins.has('l' + i) ? `<div class="peek">${esc(l)}</div>` : ''}`).join('')}
    ${m.adjuntos.map((a, i) => `<button class="chip ${S.ins.has('a' + i) ? 'ins' : ''}" onclick="inspect('a${i}')">📎 ${esc(a)}</button>${S.ins.has('a' + i) ? `<div class="peek">Tipo: ${esc(a.split('.').pop().toUpperCase())} · Origen externo · No se abrirá</div>` : ''}`).join('')}
   </div>
   <div class="row"><button class="btn ghost" onclick="hint()" ${S.hints >= 2 ? 'disabled' : ''}>💡 Pista (${2 - S.hints}) · −10</button>
   <button class="btn ghost" onclick="go('P16')">🧘 Preguntar</button></div>
   <div id="hintbox" aria-live="polite">${S.hints ? sensei(hintText(), 'hmm') : ''}</div>
   <p class="small muted">🎙️ Di "reportar", "verificar", "legítimo" o "pista".</p>`,
  { back: S.torneo ? 'P12' : 'P06', footer: `<div class="actions" role="group" aria-label="Acciones">
    <button class="btn primary" onclick="decide('reportar')">🚩 Reportar</button>
    <button class="btn" onclick="decide('verificar')">☎️ Verificar por otro canal</button>
    <button class="btn" onclick="confirmarRiesgo()">${risky}</button>
    <button class="btn" onclick="decide('legitimo')">✔️ Es legítimo</button></div>` });
},
P08() {
  const e = S.esc;
  if (S.turn === -1) return `<div class="call"><span class="sid" style="align-self:flex-end">P08</span>
    <div class="who"><div class="avatar" aria-hidden="true">📞</div><h2>${esc(callerName(e))}</h2><p style="color:#bdb5a6">Llamada entrante · +51 1 6${esc(e.id.slice(1, 4))}4 2210</p></div>
    <p style="text-align:center;color:#bdb5a6">Contesta y escucha. Puedes responder hablando o escribiendo. Di "contestar" o "colgar".</p>
    <div class="callbtns"><button class="round red" aria-label="Rechazar llamada" onclick="endCall('rechazar')">✕</button>
    <button class="round green" aria-label="Contestar llamada" onclick="answer()">✆</button></div></div>`;
  const line = e.guion[Math.min(S.turn, e.guion.length - 1)];
  const stt = VOZ.disponibleSTT() && U.voz;
  return `<div class="call"><div style="display:flex;justify-content:space-between"><span>${esc(callerName(e))} · turno ${S.turn + 1}/${e.guion.length}</span><span class="sid">P08</span></div>
   ${U.subs ? `<div class="subs" aria-live="polite"><span class="small" style="color:#bdb5a6">Atacante dice:</span><br>${esc(line)}</div>` : '<div class="subs">🔊 Escuchando… (subtítulos desactivados)</div>'}
   <div id="you" class="small" style="color:#bdb5a6;min-height:22px" aria-live="polite">${S.parcial ? `<span class="parcial">🎙️ ${esc(S.parcial)}</span>` : S.lastReply ? `Tú: “${esc(S.lastReply)}”` : ''}</div>
   <div class="quick" role="group" aria-label="Respuestas rápidas">
    <button onclick="reply('No comparto códigos por teléfono, voy a colgar.')">“No comparto códigos por teléfono, voy a colgar.”</button>
    <button onclick="reply('Le devuelvo la llamada al número oficial.')">“Le devuelvo la llamada al número oficial.”</button>
    <button onclick="reply('Ya, ahí le doy el dato.')">“Ya, ahí le doy el dato.”</button>
    <button onclick="reply('¿Me puede repetir de qué área es?')">“¿Me puede repetir de qué área es?”</button></div>
   <form onsubmit="event.preventDefault();reply(this.t.value)" style="display:flex;gap:6px;margin-top:6px"><input name="t" type="text" placeholder="Escribe tu respuesta" aria-label="Escribe tu respuesta"><button class="btn" style="width:auto;margin:0" aria-label="Enviar">↵</button></form>
   <div class="callbtns"><button class="round ${VOZ.escuchando() ? 'on' : ''}" style="background:${VOZ.escuchando() ? '#c2341f' : '#4a443b'}" id="micbtn" aria-label="${stt ? 'Responder hablando' : 'Reconocimiento de voz no disponible'}" onclick="talk()" ${stt ? '' : 'disabled'}>🎙️</button>
   <button class="round" style="background:#4a443b" aria-label="Repetir lo que dijo" onclick="repetirLinea()">↻</button>
   <button class="round red" aria-label="Colgar" onclick="endCall('colgar')">✕</button></div>
   ${S.cargando.evaluar ? '<p class="small" style="text-align:center;color:#bdb5a6"><span class="cargando"></span> El sensei analiza tu respuesta…</p>' : ''}</div>`;
},
P09() {
  const e = S.esc, r = S.result;
  const found = e.senales.map((s, i) => i < r.seen);
  const tn = tono();
  return shell('Debrief del sensei', `
   <div class="result ${r.ok ? 'ok' : 'bad'}"><b style="font-size:1.1em">${r.ok ? '✅ Ataque detectado' : (e.es_ataque ? '🎭 Esta vez te la jugaron' : '🤔 Era un mensaje legítimo')}</b>
   <p class="small" style="margin:.3em 0 0">${esc(r.detail)}</p></div>
   ${sensei(`${RG.fraseSensei(r.ok, tn.humor)}<br><br>${esc(e.debrief)}${r.comentario ? `<br><br><i>${esc(r.comentario)}</i>` : ''}`, r.ok ? 'feliz' : 'hmm')}
   <div class="card" style="margin-top:12px"><h3>Señales ${e.es_ataque ? 'de alerta' : 'de que era legítimo'}</h3>
    ${e.senales.map((s, i) => `<div class="sig"><b class="${found[i] ? 'stamp' : ''}">${found[i] ? '✔' : '•'}</b><span>${esc(s)}</span></div>`).join('')}
    <p class="small muted">✔ = lo revisaste durante el combate</p></div>
   <div class="card"><h3>Qué hacer la próxima vez</h3><p>${actionText(e)}</p></div>
   <div class="card" style="display:flex;justify-content:space-between;align-items:center"><span>Puntos de este combate${r.offline ? ' <span class="small muted">(se sincroniza luego)</span>' : ''}</span><b style="font-size:1.3em">+${r.pts}</b></div>
   ${r.logros && r.logros.length ? `<div class="card"><h3>Nuevo logro</h3>${r.logros.map(l => `<span class="logro">${RG.LOGROS[l]}</span>`).join('')}</div>` : ''}
   <div class="row"><button class="btn ghost" onclick="hablar(document.querySelector('.bubble').innerText)">🔊 Escuchar</button>
   <button class="btn ghost" onclick="S.senseiEsc='${e.id}';go('P16')">🧘 Preguntar al sensei</button></div>
   <h3>¿Cómo te quedaste?</h3><div class="emo" id="emopost">${[['😄', 'bien'], ['🙂', 'normal'], ['😕', 'confundido'], ['😣', 'frustrado']].map(([x, l]) => `<button aria-label="${l}" onclick="emocionPost('${l}')">${x}<small>${l}</small></button>`).join('')}</div>
   <button class="btn primary" onclick="${S.torneo ? "go('P12')" : 'siguienteCombate()'}">${S.torneo ? 'Volver al torneo' : 'Siguiente combate'}</button>
   <button class="btn" onclick="S.torneo=null;go('P05')">Volver al dojo</button>`);
},
P10() {
  const b = belt();
  const tac = Object.keys(TAC).map(t => { const s = U.stats[t]; return [t, s && s.total ? Math.round(s.ok / s.total * 100) : null]; }).sort((a, c) => (a[1] ?? 101) - (c[1] ?? 101));
  const ritmo = U.ritmo && U.ritmo.n ? Math.round(U.ritmo.msProm / 1000) : null;
  return shell('Mi progreso', `
   <div class="card">${beltTag(b)}<p class="small muted">${U.puntos} pts · ${U.hist.length} combates · ${U.hist.filter(h => h.ok).length} detectados${ritmo ? ` · ritmo medio ${ritmo} s por combate` : ''}</p>
   <div style="display:flex;gap:3px" aria-hidden="true">${BELTS.map((x, i) => `<i title="${x.n}" style="flex:1;height:12px;border-radius:3px;border:1px solid #0003;background:${i <= b ? x.c : '#e8e2d4'}"></i>`).join('')}</div></div>
   <div class="card"><h3>📓 Diario del guardián</h3><p>${esc(RG.diario(U))}</p>
   ${(U.logros || []).length ? `<p class="small muted">Logros</p>${U.logros.map(l => `<span class="logro">${RG.LOGROS[l] || l}</span>`).join('')}` : ''}</div>
   <div class="card"><h3>Acierto por táctica</h3><p class="small muted">Las más débiles primero. El dojo te pondrá más de estas.</p>
   ${tac.map(([t, p]) => `<div style="margin:8px 0"><div class="small" style="display:flex;justify-content:space-between"><span>${TAC[t]}</span><b>${p == null ? '—' : p + '%'}</b></div><div class="bar"><span style="width:${p ?? 0}%;background:${p == null ? 'transparent' : p < 60 ? 'var(--bad)' : 'var(--ok)'}"></span></div></div>`).join('')}</div>
   <div class="card"><h3>Historial</h3>${U.hist.length ? U.hist.slice(0, 10).map(h => `<div class="score"><span>${CANAL[h.canal] || ''} ${esc(h.t || h.id)}</span><span>${h.ok ? '✅' : '🔁'} +${h.pts}</span></div>`).join('') : '<p class="small muted">Aún no tienes combates.</p>'}</div>
   <button class="btn ghost" onclick="window.print()">📄 Exportar mi progreso en PDF</button>`, { back: 'P05', nav: true });
},
P11() {
  if (!API.enLinea) return shell('Salas', offlineCard(), { back: 'P05', nav: true });
  const salas = S.salas;
  return shell('Salas', `
   <div class="card"><h3>Unirme a una sala</h3><form class="row" onsubmit="event.preventDefault();unirse(this.c.value)"><input name="c" type="text" aria-label="Código de sala" placeholder="Código (ej. K4L9PX)" maxlength="6" style="text-transform:uppercase"><button class="btn" style="flex:0 0 90px;margin:0">Unirme</button></form>
   <button class="btn ghost small" onclick="explicarQR()">📷 Escanear QR</button></div>
   ${salas == null ? '<p><span class="cargando"></span> Cargando salas…</p>' : salas.length ? salas.map(s => {
    const t = s.torneos.find(x => x.estado === 'en_curso'); const prox = s.torneos.find(x => x.estado === 'programado');
    return `<div class="card"><span class="tag">Tu sala</span><span class="tag">🟢 ${s.conectados} conectados</span><h3>${esc(s.nombre)}</h3>
     <p class="small muted">Código <b>${s.codigo}</b> · ${s.equipos.length} equipos · ${s.miembros.length} miembros <button class="chip" onclick="verQR('${s.codigo}')">🔳 QR</button></p>
     ${s.miembros.slice(0, 6).map(m => `<div class="score small"><span>${esc(m.nombre)} <span class="muted">(${esc(m.equipo)})</span></span><span>${m.conectado ? '🟢' : '⚪'}</span></div>`).join('')}
     ${t ? `<div class="card" style="margin-top:10px"><span class="tag">🏆 Torneo en curso</span><h3>${esc(t.nombre)}</h3><p class="small muted">${t.escenarios.length} combates · quedan ${fmt(t.restante_s)} · todos reciben el mismo set</p>
       <button class="btn primary" onclick="entrarTorneo('${s.codigo}','${t.id}')">Entrar al torneo</button></div>` : prox ? `<p class="small">Próximo torneo: <b>${esc(prox.nombre)}</b> · ${new Date(prox.inicio).toLocaleString('es-PE')}</p>` : '<p class="small muted">No hay torneos activos.</p>'}
     <button class="btn" onclick="verTablero('${s.codigo}')">🥋 Tablero de cinturones</button></div>`;
  }).join('') : '<p class="small muted">Todavía no estás en ninguna sala.</p>'}
   <div class="card"><h3>Crear una sala</h3><form onsubmit="event.preventDefault();crearSala(this.n.value,this.e.value)">
   <input name="n" type="text" aria-label="Nombre de la sala" placeholder="Nombre (ej. Liga de noviembre)" required>
   <p></p><input name="e" type="text" aria-label="Equipos separados por coma" placeholder="Equipos separados por coma" value="Equipo Rojo, Equipo Azul">
   <button class="btn">➕ Crear sala</button></form></div>`, { back: 'P05', nav: true });
},
P12() {
  const t = torneoActual(); const s = S.sala;
  if (!t || !s) return shell('Torneo', `<p>No hay un torneo activo.</p><button class="btn" onclick="go('P11')">Ir a salas</button>`, { back: 'P11' });
  const done = new Set(U.hist.map(h => h.id));
  const st = Object.entries(t.marcador || {}).sort((a, b) => b[1] - a[1]);
  const mio = (s.miembros.find(m => m.id === U.id) || {}).equipo;
  const fin = t.estado === 'finalizado';
  return shell(esc(t.nombre), `
   <div class="card" style="display:flex;justify-content:space-between"><span>⏱️ ${fin ? 'Torneo terminado' : 'Tiempo restante'}</span><b id="tleft">${fin ? '🏁' : fmt(t.restante_s)}</b></div>
   ${tono().modoPractica ? sensei('Hoy elegiste ir con calma. El torneo tiene reloj, pero puedes jugar a tu ritmo: cada punto suma igual al equipo.', 'ok') : ''}
   <div class="card" aria-live="polite" id="marcador"><h3>${fin ? '🏆 Podio de equipos' : 'Marcador en vivo'}</h3>${st.map(([n, p], i) => `<div class="score ${n === mio ? 'me' : ''}"><span>${['🥇', '🥈', '🥉'][i] || i + 1 + '.'} ${esc(n)}${n === mio ? ' (tu equipo)' : ''}</span><span>${p} pts</span></div>`).join('')}
   <p class="small muted" id="ultimo">${S.ultimoPunto ? esc(S.ultimoPunto) : ''}</p></div>
   ${fin ? '' : `<h3>Combates del torneo</h3><div class="list">${t.escenarios.map(id => { const e = buscarEsc(id); if (!e) return ''; return `<button class="item" onclick="start('${id}')"><span class="ico" aria-hidden="true">${CANAL[e.canal]}</span><span class="grow"><b>${esc(e.titulo)}</b><br><span class="small muted">${e.canal}</span></span><span>${done.has(id) ? '✅' : '›'}</span></button>`; }).join('')}</div>`}
   <p class="small muted">Los puntos se suman al equipo. En el tablero nunca se muestran los errores individuales.</p>`, { back: 'P11' });
},
P13() {
  const d = S.tablero;
  return shell('Tablero de cinturones', !API.enLinea ? offlineCard() : !d ? '<p><span class="cargando"></span> Cargando…</p>' : `
   <div class="tabs" role="tablist"><button role="tab" aria-selected="${S.boardTab === 'equipos'}" onclick="S.boardTab='equipos';render()">Equipos</button><button role="tab" aria-selected="${S.boardTab === 'ind'}" onclick="S.boardTab='ind';render()">Individual</button></div>
   <div class="card">${S.boardTab === 'equipos' ? d.equipos.map((t, i) => `<div class="score"><span>${i + 1}. ${esc(t.nombre)}</span><span>${t.puntos} pts</span></div>`).join('')
     : d.individual.map((x, i) => `<div class="score ${x.yo ? 'me' : ''}"><span>${i + 1}. ${esc(x.nombre)}${x.yo ? ' (tú)' : ''} <span class="small muted">${esc(x.equipo)}</span></span><span>${beltTag(x.cinturon).replace('Cinturón ', '')}</span></div>`).join('')}</div>
   <p class="small muted">Solo se muestran cinturones, nunca errores. ¿Prefieres no aparecer con tu nombre? Activa un alias en Ajustes.</p>`, { back: 'P11', nav: true });
},
P14() {
  return shell('Ajustes', `
   <h3>Rol</h3><select class="full" aria-label="Rol" onchange="guardarPrefs({rol:this.value})">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${U.rol === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
   <h3 style="margin-top:16px">Tono del sensei</h3>${humorSeg()}
   <h3 style="margin-top:16px">Voz y accesibilidad</h3>${prefs()}
   <p class="small"><b>Velocidad de la voz</b></p><div class="seg" role="group" aria-label="Velocidad de la voz">${[[0.85, 'Lenta'], [1, 'Normal'], [1.15, 'Rápida']].map(([v, l]) => `<button aria-pressed="${(U.rate || 1) === v}" onclick="guardarPrefs({rate:${v}});render();hablar('Así sueno a esta velocidad')">${l}</button>`).join('')}</div>
   <button class="btn ghost" onclick="localStorage.removeItem('cyberdojo_checkin');go('P05')">Hacer check-in emocional</button>
   <button class="btn ghost" onclick="comandosVoz()">🎙️ Ver comandos de voz</button>
   <button class="btn ghost" onclick="sincronizarAhora()">🔄 Sincronizar ahora ${API.pendientes() ? `(${API.pendientes()} pendientes)` : ''}</button>
   <p class="small muted">Cuenta: ${esc(U.email || 'sin sesión')} · ${API.enLinea ? 'conectado al servidor' : 'sin conexión'}</p>
   <button class="btn ghost" onclick="salir()">Cerrar sesión</button>`, { back: 'P05', nav: true });
},
P15() {
  if (!API.enLinea) return shell('Panel administrador', offlineCard(), { back: 'P05' });
  if (!API.tieneAdmin()) {
    return shell('Panel administrador', `<div class="card"><h3>Ingreso del responsable de TI</h3>
     <form onsubmit="event.preventDefault();loginAdmin(this.a.value)"><label for="ad">Correo</label><input id="ad" name="a" type="email" value="javier.huaman@kallpa.test" required>
     <p class="small muted">La demo incluye un administrador: javier.huaman@kallpa.test. Tu sesión de colaborador se mantiene.</p>
     <p id="erradm" class="small" style="color:var(--bad)" role="alert"></p><button class="btn primary">Entrar</button></form></div>`, { back: 'P05' });
  }
  const t = S.adminTab;
  const tabs = `<div class="tabs" role="tablist">${[['metricas', 'Métricas'], ['escenarios', 'Escenarios'], ['torneos', 'Torneos']].map(([k, v]) => `<button role="tab" aria-selected="${t === k}" onclick="adminTab('${k}')">${v}</button>`).join('')}</div>`;
  let body = '<p><span class="cargando"></span> Cargando…</p>';
  if (t === 'metricas' && S.metricas) {
    const m = S.metricas; const max = Math.max(...m.semanas.map(s => s.tasa_deteccion || 0), 1);
    body = `<p class="small muted">${m.colaboradores} colaboradores · ${m.combates} combates registrados</p>
     <div class="card"><h3>Tasa de detección por área</h3>${m.areas.map(a => a.insuficiente ? `<p class="small">${esc(a.equipo)}: datos insuficientes (menos de 3 personas)</p>` : `<div style="margin:8px 0"><div class="small" style="display:flex;justify-content:space-between"><span>${esc(a.equipo)} <span class="muted">(${a.usuarios} pers.)</span></span><b>${a.tasa_deteccion}%</b></div><div class="bar"><span style="width:${a.tasa_deteccion}%"></span></div><p class="small muted" style="margin:4px 0">Reportan ${a.tasa_reporte}% de los ataques · más débil: ${TAC[a.tactica_mas_debil] || '—'} (${a.tactica_mas_debil_tasa ?? '—'}%)</p></div>`).join('')}</div>
     <div class="card"><h3>Evolución (últimas 4 semanas)</h3><div class="spark" role="img" aria-label="Tasa de detección por semana: ${m.semanas.map(s => 'semana ' + s.semana + ' ' + (s.tasa_deteccion ?? 0) + '%').join(', ')}">${m.semanas.map(s => `<div style="height:${(s.tasa_deteccion || 0) / max * 100}%"><span>${s.tasa_deteccion ?? '—'}%</span><small>S${s.semana}</small></div>`).join('')}</div><p></p></div>
     <div class="card"><h3>Lo más débil</h3>${m.tacticas.slice(0, 3).map(x => `<p>${esc(x.nombre)}: ${x.tasa}% de detección</p>`).join('')}<p class="small muted">Sugerencia: programar un torneo con escenarios de ${esc(m.tacticas[0] ? m.tacticas[0].nombre : '')}.</p></div>
     ${m.emociones ? `<div class="card"><h3>Clima emocional (agregado)</h3><p class="small">${m.emociones.map(e => `${esc(e.valor)} ${e.pct}%`).join(' · ')}</p></div>` : ''}
     <p class="small muted">${esc(m.nota)}</p>
     <div class="row"><button class="btn" onclick="exportarCSV()">⬇️ CSV</button><button class="btn" onclick="window.print()">📄 PDF</button></div>`;
  } else if (t === 'escenarios' && S.adminEsc) {
    const g = S.adminEsc.generados;
    body = `<div class="card"><h3>Generar con IA</h3><div class="row"><select class="full" id="genrol" aria-label="Rol">${Object.entries(ROLES).filter(([k]) => k !== 'otro').map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}<option value="todos">Todos</option></select>
     <select class="full" id="gendif" aria-label="Dificultad"><option value="1">Fácil</option><option value="2" selected>Media</option><option value="3">Difícil</option></select></div>
     <button class="btn" onclick="generarAdmin()" id="btngen">✨ Generar borrador</button><p class="small muted">Proveedor LLM: ${esc(S.llm ? S.llm.proveedor : '?')}. Los borradores no se usan en torneos hasta que los apruebes.</p></div>
     ${g.map(x => `<div class="card"><span class="tag" style="background:${x.estado === 'aprobado' ? 'var(--okbg)' : x.estado === 'rechazado' ? 'var(--badbg)' : 'var(--warnbg)'}">${{ pendiente: 'Generado por IA · pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado', practica: 'Práctica personal' }[x.estado] || x.estado}</span><span class="tag">${esc(x.origen)}</span>
      <h3>${esc(x.titulo)}</h3><p class="small">Rol: ${esc(ROLES[x.rol] || x.rol)} · ${esc(x.canal)} · dificultad ${x.dificultad} · ${esc(x.id)}</p>
      <p class="small muted">${esc((x.mensaje ? x.mensaje.cuerpo : (x.guion || []).join(' ')).slice(0, 220))}…</p>
      <details><summary class="small">Ver señales y debrief</summary><ul class="small">${x.senales.map(s => `<li>${esc(s)}</li>`).join('')}</ul><p class="small">${esc(x.debrief)}</p></details>
      ${x.estado !== 'aprobado' ? `<div class="row"><button class="btn" onclick="revisar('${x.id}','aprobado')">Aprobar</button><button class="btn ghost" onclick="editarEsc('${x.id}')">Editar</button>${x.estado !== 'rechazado' ? `<button class="btn ghost" onclick="revisar('${x.id}','rechazado')">Rechazar</button>` : ''}</div>` : ''}</div>`).join('')}
     <p class="small muted">Además hay ${S.adminEsc.banco.length} escenarios del banco revisados por el equipo.</p>`;
  } else if (t === 'torneos' && S.adminSalas) {
    const aprob = ESC;
    body = `<div class="card"><h3>Nuevo torneo</h3>
     <label class="small" for="tsala">Sala</label><select class="full" id="tsala">${S.adminSalas.map(s => `<option value="${s.codigo}">${esc(s.nombre)} (${s.codigo})</option>`).join('')}</select>
     <p></p><label class="small" for="tn">Nombre</label><input id="tn" type="text" value="Copa Kallpa: semana del phishing">
     <p></p><label class="small" for="tdur">Duración (minutos)</label><input id="tdur" type="text" inputmode="numeric" value="15">
     <p class="small"><b>Escenarios aprobados</b></p>${aprob.map(e => `<label class="opt small"><input type="checkbox" name="tesc" value="${e.id}" ${['E12', 'E13', 'E15'].includes(e.id) ? 'checked' : ''}>${e.id} · ${esc(e.titulo)} <span class="muted">(${esc(ROLES[e.rol] || e.rol)})</span>${e.generado ? ' ✨' : ''}</label>`).join('')}
     <button class="btn primary" onclick="crearTorneo()">Crear torneo</button>
     <div id="qrbox"></div></div>`;
  }
  return shell('Panel administrador', tabs + body + `<button class="btn ghost small" onclick="API.LS.del('cyberdojo_token_admin');render()">Salir del modo administrador</button>`, { back: 'P05' });
},
P16() {
  const e = S.senseiEsc && buscarEsc(S.senseiEsc);
  const stt = VOZ.disponibleSTT();
  const sugs = ['¿Cómo reconozco un correo falso?', '¿Qué hago si me llaman del banco pidiendo un código?', 'Dame un consejo para mi rol', ...(e ? ['¿Por qué el último combate era así?'] : [])];
  return shell('Sensei', `
   ${sensei(`Pregúntame lo que quieras sobre ataques, señales o tu progreso. ${stt ? 'Toca el micrófono y habla.' : 'Escribe tu pregunta (tu navegador no reconoce voz).'}${e ? `<br><span class="small muted">Contexto: “${esc(e.titulo)}”</span>` : ''}`, 'ok')}
   <div class="chat" id="chat" aria-live="polite" style="margin:12px 0">${S.chat.map(m => `<div class="msg ${m.de}">${esc(m.t)}${m.origen ? `<small>${m.origen === 'reglas' ? 'respuesta sin IA' : 'IA: ' + esc(m.origen)}</small>` : ''}</div>`).join('')}
   ${S.cargando.sensei ? '<div class="msg sensei"><span class="cargando"></span> Pensando…</div>' : ''}${S.parcial && S.screen === 'P16' ? `<div class="msg yo" style="opacity:.6">${esc(S.parcial)}…</div>` : ''}</div>
   <button class="micgrande ${VOZ.escuchando() ? 'on' : ''}" id="micsensei" onclick="preguntarVoz()" aria-label="${VOZ.escuchando() ? 'Escuchando, toca para detener' : 'Hablar con el sensei'}" ${stt ? '' : 'disabled'}>🎙️</button>
   <form onsubmit="event.preventDefault();preguntar(this.q.value);this.q.value=''" style="display:flex;gap:6px"><input name="q" type="text" placeholder="Escribe tu pregunta" aria-label="Escribe tu pregunta"><button class="btn" style="width:auto;margin:0" aria-label="Enviar">↵</button></form>
   <div class="sugs" style="margin-top:10px">${sugs.map(q => `<button onclick="preguntar(this.textContent)">${esc(q)}</button>`).join('')}</div>`, { back: 'P05', nav: true });
},
};

function humorSeg() { return `<div class="seg" role="group" aria-label="Tono del sensei">${['Serio', 'Algo de humor', 'Chistoso'].map((x, i) => `<button aria-pressed="${U.humor === i}" onclick="guardarPrefs({humor:${i}});render()">${x}</button>`).join('')}</div>`; }
function prefs() {
  return `
  <label class="opt"><input type="checkbox" ${U.voz ? 'checked' : ''} onchange="guardarPrefs({voz:this.checked})">Usar voz (llamadas y sensei)</label>
  <label class="opt"><input type="checkbox" ${U.subs ? 'checked' : ''} onchange="guardarPrefs({subs:this.checked})">Subtítulos en llamadas</label>
  <label class="opt"><input type="checkbox" ${U.sonidos !== false ? 'checked' : ''} onchange="guardarPrefs({sonidos:this.checked})">Sonidos y vibración</label>
  <label class="opt"><input type="checkbox" ${U.useAlias ? 'checked' : ''} onchange="guardarPrefs({useAlias:this.checked})">Aparecer con alias en el tablero</label>
  <input type="text" aria-label="Alias" placeholder="Alias (ej. Ninja_Contable)" value="${esc(U.alias)}" maxlength="24" onchange="guardarPrefs({alias:this.value})">
  <p class="small"><b>Tamaño de letra</b></p><div class="seg" role="group" aria-label="Tamaño de letra">${[[1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, l]) => `<button aria-pressed="${U.fs === v}" onclick="guardarPrefs({fs:${v}});render()">${l}</button>`).join('')}</div>`;
}
function checkin() {
  modal('¿Cómo llegas hoy?', `<p class="small muted">Opcional. Solo lo usa el sensei para ajustar el ritmo y el tono. Tu administrador nunca lo ve de forma individual.</p>
   <div class="emo">${[['😄', 'con ganas'], ['🙂', 'normal'], ['😴', 'cansado'], ['😣', 'estresado']].map(([e, l]) => `<button onclick="emocionAntes('${l}')">${e}<small>${l}</small></button>`).join('')}</div>`,
  [{ t: 'Saltar', ghost: true, fn: () => API.LS.set('cyberdojo_checkin', hoy()) }]);
}
function callerName(e) { return { E03: 'Banco Andino - Seguridad', E07: 'Mesa de ayuda (?)', E10: 'Número desconocido', E15: 'Recursos Humanos (?)' }[e.id] || 'Número desconocido'; }
function actionText(e) {
  const m = { reportar_y_verificar: 'Reporta el mensaje con el botón 🚩 y confirma con la persona por un canal que ya conozcas (su anexo o celular de siempre).',
    verificar_por_otro_canal: 'Llama al proveedor al número que ya tenías registrado antes de cambiar cualquier dato bancario.',
    colgar_y_llamar_oficial: 'Cuelga y llama tú al número oficial que está en la tarjeta o en la web.',
    reportar: 'Repórtalo con 🚩 sin abrir enlaces ni adjuntos.', reportar_y_no_fusionar: 'No apruebes el cambio; revisa el nombre exacto del paquete y repórtalo.',
    reportar_e_ir_directo_al_sitio: 'Repórtalo y entra al sitio escribiendo la dirección tú mismo.', negar_y_reportar: 'No compartas el código, termina la llamada y repórtala a seguridad.',
    verificar_con_jefatura: 'Pídele que solicite acceso por el canal formal y confirma con la jefatura.', registrar_y_confirmar: 'Pide identificación, registra la visita y confirma con el contacto interno.',
    negar_y_derivar: 'No des datos de otras personas; deriva a RR.HH. y devuelve la llamada al anexo oficial.', entregar_a_ti_sin_conectar: 'No lo conectes; entrégalo a TI.',
    eliminar_y_reportar: 'Bórralo y repórtalo; no abras el enlace.', marcar_legitimo: 'Puedes seguir normalmente. Si dudas, igual puedes verificar por el anexo indicado.',
    negar_y_verificar: 'No des datos por teléfono; acércate o llama al anexo oficial de RR.HH.' };
  return m[e.accion_correcta] || 'Verifica por un canal conocido y reporta.';
}
function hintText() { const e = S.esc; return S.hints === 1 ? `Mira con calma ${e.canal === 'presencial' ? 'quién lo pide y cómo' : 'el remitente'}.` : `Pista 2: ${esc(e.senales[1] || e.senales[0])}.`; }
function torneoActual() {
  if (!S.torneo || !S.sala) return null;
  return S.sala.torneos.find(t => t.id === S.torneo.id) || null;
}

/* ---------------- navegación y datos por pantalla ---------------- */
window.go = id => {
  if (S.screen === 'P08' && id !== 'P08') { EMO.timbreLlamada(false); VOZ.detener(); VOZ.callar(); }
  S.screen = id; S.parcial = '';
  render(); window.scrollTo(0, 0);
  const h = $('#vista h1, #vista h2'); h && h.focus({ preventScroll: true });
  cargarDatos(id);
};

async function cargarDatos(id) {
  if (!['P11', 'P12', 'P13'].includes(id)) { cerrarSSE(); cerrarSSE = () => {}; }
  if (id === 'P05' && (API.tieneSesion() || U.email) && API.LS.get('cyberdojo_checkin') !== hoy() && !S.modal) checkin();
  if (!API.enLinea) return;
  try {
    if (id === 'P05' && API.tieneSesion()) { const r = await API.siguiente(false); S.sugerido = r.escenario.id; if (!buscarEsc(r.escenario.id)) EXTRA[r.escenario.id] = r.escenario; if (S.screen === 'P05' && !S.modal) render(); }
    if (id === 'P11') { const r = await API.salas(); S.salas = r.salas; if (S.salas[0]) suscribir(S.salas[0].codigo); if (S.screen === 'P11') render(); }
    if ((id === 'P12' || id === 'P13') && !S.sala) {
      const r = await API.salas(); S.salas = r.salas;
      const s = S.salas.find(x => x.torneos.some(t => t.estado === 'en_curso')) || S.salas[0];
      if (s) { S.sala = s; suscribir(s.codigo); }
    }
    if (id === 'P12' && !torneoActual() && S.sala) {
      const t = S.sala.torneos.find(x => x.estado === 'en_curso');
      if (t) return entrarTorneo(S.sala.codigo, t.id);
      if (S.screen === 'P12') render();
    }
    if (id === 'P13' && S.sala) { S.tablero = await API.tablero(S.sala.codigo); if (S.screen === 'P13') render(); }
    if (id === 'P15' && API.tieneAdmin()) await adminTab(S.adminTab, true);
  } catch (e) { if (!e.offline) toast(e.message, 'warn'); }
}

function suscribir(codigo) {
  cerrarSSE();
  cerrarSSE = API.eventos(codigo, {
    sala: info => {
      S.sala = info;
      if (S.salas) S.salas = S.salas.map(s => s.codigo === info.codigo ? info : s);
      if (['P11', 'P12'].includes(S.screen) && !S.modal) render();
    },
    marcador: d => {
      if (!S.sala) return;
      const t = S.sala.torneos.find(x => x.id === d.torneo); if (t) t.marcador = d.marcador;
      S.ultimoPunto = `+${d.ultimo.puntos} para ${d.ultimo.equipo} (${d.ultimo.quien})`;
      if (S.screen === 'P12' && !S.modal) render();
    },
  });
}

/* ---------------- acciones ---------------- */
window.doLogin = async () => {
  const em = $('#em').value.trim(), org = $('#org').value.trim();
  const b = $('#btnlogin'); b.disabled = true; b.innerHTML = '<span class="cargando"></span>';
  try {
    if (API.enLinea || location.protocol.startsWith('http')) {
      const r = await API.login(em, org);
      aplicarPerfil(r.usuario);
      await sincronizarAhora(true);
      if (pendienteSala) { const c = pendienteSala; pendienteSala = null; return unirse(c); }
      return go(r.nuevo || !U.calibrado ? 'P03' : 'P05');
    }
    throw Object.assign(new Error('offline'), { offline: true });
  } catch (e) {
    if (e.offline) {
      if (org && org.toUpperCase() !== 'KALLPA') { $('#err').textContent = 'No encontramos ese código. Pídeselo al área de TI o deja el campo vacío.'; return; }
      U.email = em; guardarLocal(); toast('Sin conexión: entrenas en modo local y sincronizamos después.', 'warn'); go(U.calibrado ? 'P05' : 'P03');
    } else { $('#err').textContent = e.message; }
  } finally { const bb = $('#btnlogin'); if (bb) { bb.disabled = false; bb.textContent = 'Continuar'; } }
};
window.loginAdmin = async email => {
  try {
    const r = await API.login(email, '', { admin: true });
    if (!r.usuario.esAdmin) { API.LS.del('cyberdojo_token_admin'); $('#erradm').textContent = 'Ese correo no tiene permisos de administrador.'; return; }
    render(); cargarDatos('P15');
  } catch (e) { $('#erradm').textContent = e.message; }
};
window.salir = () => { API.salir(); U = RG.perfilVacio(); guardarLocal(); S.salas = null; S.sala = null; go('P01'); };
window.calib = ok => { if (ok) S.calibOk++; S.calib++; EMO.clic(); render(); };
window.emocionAntes = valor => {
  API.LS.set('cyberdojo_checkin', hoy());
  U.emociones.push({ fecha: new Date().toISOString(), momento: 'antes', valor }); guardarLocal();
  API.emocion('antes', valor);
  cerrarModal(); render();
  if (RG.EMOCIONES_BAJAS.includes(valor)) hablar('Gracias por contarme. Hoy vamos con calma.');
};
window.emocionPost = valor => {
  U.emociones.push({ fecha: new Date().toISOString(), momento: 'despues', valor }); guardarLocal();
  API.emocion('despues', valor);
  const box = $('#emopost');
  if (valor === 'confundido' || valor === 'frustrado') {
    box.outerHTML = `<div class="card">${sensei('Gracias por decírmelo. El siguiente combate será un poco más sencillo. ¿Quieres que te lo explique con calma?', 'ok')}<button class="btn" onclick="S.senseiEsc='${S.esc.id}';go('P16')">🧘 Sí, explícame</button></div>`;
  } else box.innerHTML = '<p class="small">Gracias, lo tomo en cuenta para el siguiente combate.</p>';
};

window.start = id => {
  const e = buscarEsc(id); if (!e) return toast('Ese combate no está disponible', 'warn');
  S.esc = e; S.ins = new Set(); S.hints = 0; S.turn = -1; S.lastReply = ''; S.t0 = Date.now(); S.usoVoz = false; S.result = null;
  VOZ.callar();
  go(e.canal === 'llamada' ? 'P08' : 'P07');
  if (e.canal === 'llamada') EMO.timbreLlamada(true);
};
window.siguienteCombate = () => { const e = RG.sugerir(U, ESC); start(e.id); };
window.combateIA = async () => {
  const b = $('#btnia'); if (b) { b.disabled = true; b.innerHTML = '<span class="cargando"></span> El sensei prepara un combate para ti…'; }
  try {
    const r = await API.siguiente(true);
    const e = r.escenario;
    if (!buscarEsc(e.id)) EXTRA[e.id] = e;
    if (!e.generado) toast('La IA no respondió (' + (r.motivo || 'sin LLM configurado') + '). Te doy un combate del banco.', 'warn');
    start(e.id);
  } catch (e) { toast(e.message, 'warn'); render(); }
};
window.inspect = k => { S.ins.add(k); EMO.clic(); render(); say('Elemento inspeccionado'); };
window.hint = () => { if (S.hints < 2) { S.hints++; render(); hablar(document.querySelector('#hintbox .bubble').innerText); } };
window.confirmarRiesgo = () => modal('¿Seguro?', '<p>Esto haría lo que pide el mensaje. En la vida real podría ser irreversible.</p>',
  [{ t: 'Sí, hacerlo', fn: () => { setTimeout(() => decide('responder'), 0); } }, { t: 'Mejor no', primary: true }]);

async function registrar(base, calculo) {
  const c = { idLocal: uid(), escenarioId: S.esc.id, ms: Date.now() - S.t0, fecha: new Date().toISOString(),
    ...(S.torneo ? { torneo: S.torneo } : {}), ...base };
  const antes = belt();
  let r = null;
  try { r = await API.combate(c); } catch (e) { toast(e.message, 'warn'); } // sin conexión: queda en la cola
  if (r) {
    aplicarPerfil(r.perfil);
    return { ok: r.ok, pts: r.puntos, subio: r.subioCinturon, logros: r.logrosNuevos || [], offline: false };
  }
  const out = RG.aplicarCombate(U, { ...c, tacticas: S.esc.tacticas, titulo: S.esc.titulo, canal: S.esc.canal, ok: calculo.ok, puntos: calculo.pts, inspeccionados: base.inspeccionados });
  guardarLocal();
  return { ok: calculo.ok, pts: calculo.pts, subio: belt() > antes, logros: out.logrosNuevos, offline: true };
}

function celebrar(r) {
  if (r.ok) { EMO.gong(); EMO.vibrar(60); } else { EMO.suave(); }
  if (r.logros && r.logros.length) setTimeout(() => toast('Logro: ' + r.logros.map(l => RG.LOGROS[l]).join(', '), 'ok'), 600);
  if (r.subio) {
    setTimeout(() => {
      EMO.subida(); EMO.confeti($('#phone'));
      modal('¡Nuevo cinturón!', `<div style="text-align:center;font-size:3em" aria-hidden="true">🥋</div><p style="text-align:center">${beltTag(belt())}</p><p class="small muted" style="text-align:center">Tu sala lo verá en el tablero de cinturones.</p>`, [{ t: 'Seguir entrenando', primary: true }]);
      hablar(`¡Felicitaciones! Ahora eres cinturón ${BELTS[belt()].n}.`);
    }, 700);
  }
  if (S.usoVoz) setTimeout(() => hablar(RG.fraseSensei(r.ok, tono().humor) + ' ' + S.esc.debrief), 400);
}

window.decide = async a => {
  const e = S.esc;
  const calc = RG.puntosMensaje(e, a, S.ins.size, S.hints);
  const r = await registrar({ accion: a, inspeccionados: S.ins.size, pistas: S.hints }, calc);
  const seen = Math.min(e.senales.length, S.ins.size + (r.ok ? 1 : 0));
  S.result = { ...r, seen, detail: r.ok ? `Elegiste: ${({ reportar: 'reportar', verificar: 'verificar por otro canal', legitimo: 'marcar como legítimo' })[a]}.`
    : (e.es_ataque ? 'Seguiste la indicación del mensaje. Los +10 son por animarte: así se aprende.' : 'Lo marcaste como sospechoso. Mejor prevenir, pero aprende a reconocer lo legítimo para no saturar a seguridad.') };
  if (a === 'reportar') EMO.sello();
  go('P09'); celebrar(r);
};

window.answer = () => { EMO.timbreLlamada(false); S.turn = 0; render(); decirLinea(); };
async function decirLinea() {
  const e = S.esc;
  await hablar(e.guion[S.turn], { pitch: 0.9 });
  // HU06: al terminar la voz del atacante se activa el micrófono con indicador visible
  if (S.screen === 'P08' && S.turn >= 0 && U.voz && VOZ.disponibleSTT()) talk(true);
}
window.repetirLinea = () => { VOZ.detener(); decirLinea(); };
window.reply = async t => {
  if (!t || S.cargando.evaluar) return;
  S.lastReply = t; S.parcial = '';
  const e = S.esc;
  let ev = RG.evaluarRespuesta(e, t);
  if (!ev.decidido && API.enLinea) {
    S.cargando.evaluar = true; render();
    try { ev = await API.evaluar(e.id, t); } catch (x) { /* se sigue con reglas */ }
    S.cargando.evaluar = false;
    if (S.screen !== 'P08') return;
  }
  if (ev.decidido) return endCall(ev.seguro ? 'ok' : 'cayo', ev.comentario);
  if (S.turn < e.guion.length - 1) { S.turn++; render(); decirLinea(); } else endCall('corte');
};
window.talk = auto => {
  if (VOZ.escuchando()) { VOZ.detener(); render(); return; }
  S.usoVoz = true;
  VOZ.escuchar({ onParcial: p => { S.parcial = p; const y = $('#you'); if (y) y.innerHTML = `<span class="parcial">🎙️ ${esc(p)}</span>`; } })
    .then(txt => { S.parcial = ''; const cmd = VOZ.interpretar(txt); if (cmd.tipo === 'accion' && cmd.accion === 'colgar') return endCall('colgar'); if (cmd.tipo === 'accion' && cmd.accion === 'repetir') return repetirLinea(); reply(txt); })
    .catch(err => { S.parcial = ''; if (S.screen === 'P08') render(); if (!auto && err.message !== 'aborted') toast(err.message === 'sin-stt' ? 'Tu navegador no reconoce voz: responde con los botones o escribiendo.' : 'No te escuché bien. Habla de nuevo o escribe tu respuesta.', 'warn'); });
  render();
};
window.endCall = async (how, comentario) => {
  EMO.timbreLlamada(false); VOZ.detener(); VOZ.callar();
  const e = S.esc, turno = Math.max(0, S.turn);
  const calc = RG.puntosLlamada(e, how, turno);
  const r = await registrar({ final: how, turno, accion: how }, calc);
  S.result = { ...r, seen: r.ok ? Math.min(e.senales.length, turno + 2) : turno, comentario,
    detail: { ok: 'Te negaste y propusiste verificar por un canal oficial. Perfecto.', colgar: 'Colgaste a tiempo. Válido y seguro.', rechazar: 'No contestaste un número que no conocías. Válido, pero practica también contestar y negarte.', corte: 'El atacante se cansó, pero no llegaste a cortar la conversación tú.', cayo: 'Le diste el dato al atacante. Los +10 son por intentarlo.' }[how] };
  go('P09'); celebrar(r);
};

/* ---- sensei por voz ---- */
window.preguntar = async q => {
  q = String(q || '').trim(); if (!q) return;
  S.chat.push({ de: 'yo', t: q }); S.cargando.sensei = true; render();
  let resp;
  try { resp = await API.sensei(q, S.senseiEsc); } catch (e) {
    const ctx = S.senseiEsc && buscarEsc(S.senseiEsc);
    resp = { respuesta: ctx ? `${ctx.es_ataque ? 'Era un ataque' : 'Era legítimo'}. Señales: ${ctx.senales.slice(0, 2).join('; ')}. ${ctx.debrief}` : 'Sin conexión no puedo pensar mucho, pero la regla de oro siempre sirve: frena, revisa quién te escribe y qué te pide, y verifica por un canal que ya conozcas.', origen: 'reglas' };
  }
  S.cargando.sensei = false;
  S.chat.push({ de: 'sensei', t: resp.respuesta, origen: resp.origen });
  S.chat = S.chat.slice(-12);
  if (S.screen === 'P16') { render(); const c = $('#main'); c && (c.scrollTop = c.scrollHeight); }
  hablar(resp.respuesta);
};
window.preguntarVoz = () => {
  if (VOZ.escuchando()) { VOZ.detener(); render(); return; }
  VOZ.escuchar({ onParcial: p => { S.parcial = p; render(); } })
    .then(t => { S.parcial = ''; const c = VOZ.interpretar(t); if (c.tipo === 'nav' && c.destino !== 'P16') return go(c.destino); preguntar(t); })
    .catch(err => { S.parcial = ''; render(); if (err.message !== 'aborted') toast('No te escuché bien. Intenta otra vez o escribe.', 'warn'); });
  render();
};

/* ---- salas y torneos ---- */
let pendienteSala = null;
window.unirse = async codigo => {
  codigo = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(codigo)) return toast('El código tiene 6 letras o números.', 'warn');
  try {
    const r = await API.unirse(codigo);
    toast(`Te uniste a ${r.nombre} en el equipo ${r.miEquipo}`, 'ok'); EMO.gong();
    S.salas = null; go('P11');
  } catch (e) { toast(e.message, 'warn'); }
};
window.crearSala = async (nombre, equipos) => {
  try {
    const s = await API.crearSala(nombre, equipos.split(',').map(x => x.trim()).filter(Boolean));
    await API.unirse(s.codigo);
    toast(`Sala creada. Código: ${s.codigo}`, 'ok'); S.salas = null; go('P11'); setTimeout(() => verQR(s.codigo), 400);
  } catch (e) { toast(e.message, 'warn'); }
};
window.verQR = codigo => modal(`Código ${codigo}`, `<img class="qrimg" src="${API.qrURL(codigo)}" alt="Código QR para unirse a la sala ${codigo}"><p class="small muted" style="text-align:center">Escanéalo con la cámara del celular o comparte el código <b>${codigo}</b>.</p>`);
window.explicarQR = () => modal('Escanear QR', '<p>Abre la cámara de tu celular y apunta al QR que te comparta tu responsable. Se abrirá CyberDojo y te unirá a la sala automáticamente.</p><p class="small muted">Si no tienes cámara, escribe el código de 6 caracteres.</p>');
window.entrarTorneo = (codigo, id) => {
  S.torneo = { sala: codigo, id };
  S.sala = (S.salas || []).find(s => s.codigo === codigo) || S.sala;
  clearInterval(relojTorneo);
  relojTorneo = setInterval(() => {
    const t = torneoActual(); if (!t) return;
    t.restante_s = Math.max(0, t.restante_s - 1);
    if (t.restante_s === 0 && t.estado === 'en_curso') { t.estado = 'finalizado'; if (S.screen === 'P12') render(); }
    const el = $('#tleft') || $('#tleft2'); if (el && t.estado !== 'finalizado') el.textContent = fmt(t.restante_s);
  }, 1000);
  go('P12');
};
window.verTablero = codigo => { S.sala = (S.salas || []).find(s => s.codigo === codigo) || S.sala; S.tablero = null; go('P13'); };

/* ---- administrador ---- */
window.adminTab = async (tab, silencioso) => {
  S.adminTab = tab; if (!silencioso) render();
  try {
    if (tab === 'metricas') S.metricas = await API.admin.metricas();
    if (tab === 'escenarios') S.adminEsc = await API.admin.escenarios();
    if (tab === 'torneos') S.adminSalas = (await API.admin.salas()).salas;
    if (S.screen === 'P15') render();
  } catch (e) { if (e.status === 401 || e.status === 403) API.LS.del('cyberdojo_token_admin'); toast(e.message, 'warn'); render(); }
};
window.exportarCSV = async () => {
  try {
    const b = await API.admin.csv();
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'cyberdojo_metricas.csv'; a.click();
    toast('CSV descargado', 'ok');
  } catch (e) { toast(e.message, 'warn'); }
};
window.revisar = async (id, estado) => {
  try { await API.admin.actualizar(id, { estado }); toast(estado === 'aprobado' ? 'Escenario aprobado: ya se puede usar en torneos' : 'Escenario ' + estado, 'ok'); await refrescarEscenarios(); adminTab('escenarios', true); } catch (e) { toast(e.message, 'warn'); }
};
window.editarEsc = id => {
  const g = S.adminEsc.generados.find(x => x.id === id);
  modal('Editar escenario', `<label class="small" for="ed-t">Título</label><input id="ed-t" type="text" value="${esc(g.titulo)}">
    ${g.mensaje ? `<p></p><label class="small" for="ed-c">Mensaje</label><textarea id="ed-c">${esc(g.mensaje.cuerpo)}</textarea>` : ''}
    <p></p><label class="small" for="ed-d">Debrief del sensei</label><textarea id="ed-d">${esc(g.debrief)}</textarea>`,
  [{ t: 'Guardar y aprobar', primary: true, fn: m => { const d = { titulo: m.querySelector('#ed-t').value, debrief: m.querySelector('#ed-d').value, estado: 'aprobado' }; const c = m.querySelector('#ed-c'); if (c) d.cuerpo = c.value; API.admin.actualizar(id, d).then(async () => { toast('Guardado y aprobado', 'ok'); await refrescarEscenarios(); adminTab('escenarios', true); }).catch(e => toast(e.message, 'warn')); } },
    { t: 'Cancelar', ghost: true }]);
};
window.generarAdmin = async () => {
  const b = $('#btngen'); b.disabled = true; b.innerHTML = '<span class="cargando"></span> Generando…';
  try {
    const r = await API.admin.generar({ rol: $('#genrol').value, dificultad: Number($('#gendif').value) });
    toast(r.generado ? 'Borrador generado: revísalo abajo' : r.mensaje, r.generado ? 'ok' : 'warn');
    adminTab('escenarios', true);
  } catch (e) { toast(e.message, 'warn'); render(); }
};
window.crearTorneo = async () => {
  const ids = [...document.querySelectorAll('input[name=tesc]:checked')].map(x => x.value);
  const codigo = $('#tsala').value;
  try {
    const t = await API.crearTorneo(codigo, { nombre: $('#tn').value, duracion_min: Number($('#tdur').value) || 15, escenarios: ids }, true);
    $('#qrbox').innerHTML = `<p style="text-align:center">Torneo <b>${esc(t.nombre)}</b> creado en la sala <b>${codigo}</b>. Empieza ahora y dura ${t.duracion_min} min.</p><img class="qrimg" src="${API.qrURL(codigo)}" alt="QR de la sala ${codigo}"><p class="small muted" style="text-align:center">Comparte el código o el QR con los equipos.</p>`;
    toast('Torneo creado', 'ok');
  } catch (e) { toast(e.message, 'warn'); }
};
async function refrescarEscenarios() {
  try { const r = await API.escenarios(); ESC = r.escenarios; } catch (e) { /* se queda el banco local */ }
}

/* ---- varios ---- */
window.sincronizarAhora = async silencioso => {
  const r = await API.sincronizar();
  if (r) { aplicarPerfil(r.perfil); if (r.sincronizados) toast(`Se sincronizaron ${r.sincronizados} combate(s) hechos sin conexión`, 'ok'); }
  else if (!silencioso) toast(API.pendientes() ? 'Aún sin conexión: lo intento de nuevo al reconectar' : 'Todo está al día', API.pendientes() ? 'warn' : 'ok');
  if (!silencioso) render();
};
window.comandosVoz = () => modal('Comandos de voz', `<p class="small">Toca 🎙️ (o la tecla <b>V</b>) y di:</p>
  <ul class="small"><li><b>Navegar:</b> "dojo", "progreso", "salas", "torneo", "tablero", "ajustes", "sensei"</li>
  <li><b>En combate:</b> "reportar", "verificar", "es legítimo", "pista", "siguiente"</li>
  <li><b>En llamadas:</b> "contestar", "colgar", "repetir"</li>
  <li><b>Accesibilidad:</b> "letra más grande", "silencio", "volver"</li></ul>
  <p class="small muted">Cualquier otra frase se la paso al sensei como pregunta.</p>`);

/* ---- voz global (RF19) ---- */
function ejecutarComando(c) {
  const pantalla = S.screen;
  if (c.tipo === 'nav') return go(c.destino);
  if (c.tipo === 'pregunta') { if (pantalla !== 'P16') go('P16'); return preguntar(c.texto); }
  const a = c.accion;
  const enCombate = pantalla === 'P07';
  if (enCombate && ['reportar', 'verificar', 'legitimo'].includes(a)) { S.usoVoz = true; return decide(a); }
  if (a === 'pista' && enCombate) return hint();
  if (a === 'siguiente') return siguienteCombate();
  if (a === 'empezar') return pantalla === 'P05' ? start((S.sugerido && buscarEsc(S.sugerido) || RG.sugerir(U, ESC)).id) : siguienteCombate();
  if (a === 'contestar' && pantalla === 'P08' && S.turn === -1) return answer();
  if (a === 'colgar' && pantalla === 'P08') return endCall(S.turn === -1 ? 'rechazar' : 'colgar');
  if (a === 'repetir') return VOZ.ultimo ? hablar(VOZ.ultimo) : toast('No hay nada que repetir todavía');
  if (a === 'callar') return VOZ.callar();
  if (a === 'letra+') { guardarPrefs({ fs: Math.min(1.3, +(U.fs + 0.15).toFixed(2)) }); return render(); }
  if (a === 'letra-') { guardarPrefs({ fs: Math.max(1, +(U.fs - 0.15).toFixed(2)) }); return render(); }
  if (a === 'volver') { const b = $('.back'); return b ? b.click() : go('P05'); }
  if (a === 'comandos') return comandosVoz();
  if (a === 'pista') return toast('Las pistas se piden dentro de un combate');
  toast(`Escuché "${c.texto}", pero aquí no aplica. Di "comandos" para ver opciones.`);
}
function escucharGlobal() {
  const fab = $('#fab'), oido = $('#oido');
  if (VOZ.escuchando()) { VOZ.detener(); fab.classList.remove('on'); oido.hidden = true; return; }
  if (!VOZ.disponibleSTT()) return modal('Voz no disponible', '<p>Tu navegador no tiene reconocimiento de voz. Usa Chrome o Edge (en celular necesita HTTPS). Todo se puede hacer también con botones y texto.</p>');
  fab.classList.add('on'); oido.hidden = false; oido.textContent = '🎙️ Te escucho… di un comando o una pregunta';
  VOZ.escuchar({ onParcial: p => { oido.textContent = '🎙️ ' + p; } })
    .then(t => { oido.textContent = '✔ ' + t; setTimeout(() => { oido.hidden = true; }, 1500); ejecutarComando(VOZ.interpretar(t)); })
    .catch(() => { oido.textContent = 'No te escuché. Toca 🎙️ e inténtalo otra vez.'; setTimeout(() => { oido.hidden = true; }, 2000); })
    .finally(() => fab.classList.remove('on'));
}

/* ---------------- render ---------------- */
function render() {
  document.documentElement.style.setProperty('--fs', U.fs || 1);
  if (['P07', 'P08', 'P09'].includes(S.screen) && !S.esc) { S.esc = ESC[S.screen === 'P08' ? 2 : 0]; S.turn = -1; S.result = { ok: true, pts: 80, seen: 2, detail: '(vista directa de la pantalla)', logros: [] }; }
  if (S.screen === 'P09' && !S.result) S.result = { ok: true, pts: 0, seen: 0, detail: '', logros: [] };
  $('#vista').innerHTML = R[S.screen]();
  $('#jump').value = S.screen;
  const h = $('#vista h1, #vista h2'); h && h.setAttribute('tabindex', '-1');
  const fab = $('#fab');
  fab.hidden = S.screen === 'P08' || S.screen === 'P16';
  fab.classList.toggle('sinnav', SIN_NAV.includes(S.screen));
  fab.classList.toggle('confooter', S.screen === 'P07');
  $('#oido').classList.toggle('sinnav', SIN_NAV.includes(S.screen));
  pintarModal();
}

function pintarEstado(salud) {
  const e = $('#estado');
  const on = API.enLinea;
  e.className = 'estado ' + (on ? 'on' : 'off');
  e.querySelector('span').textContent = on ? `Servidor conectado · LLM: ${salud ? salud.llm.proveedor : (S.llm ? S.llm.proveedor : '?')}` : (location.protocol.startsWith('http') ? 'Sin conexión: modo local' : 'Archivo local: sin servidor');
}

/* ---------------- arranque ---------------- */
$('#jump').innerHTML = SCREENS.map(([id, n]) => `<option value="${id}">${id} · ${n}</option>`).join('');
$('#jump').onchange = e => go(e.target.value);
$('#reset').onclick = () => modal('Reiniciar demo', '<p>Se borra el perfil de este navegador y se cierra la sesión. Los datos del servidor se mantienen (usa <code>npm run reset</code> para reiniciarlos).</p>',
  [{ t: 'Reiniciar', primary: true, fn: () => { API.salir(); ['cyberdojo_perfil', 'cyberdojo_checkin'].forEach(API.LS.del); U = RG.perfilVacio(); S.chat = []; S.torneo = null; S.esc = null; S.salas = null; setTimeout(() => go('P01'), 0); } }, { t: 'Cancelar', ghost: true }]);
$('#fab').onclick = escucharGlobal;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.modal) { cerrarModal(); return; }
  const tag = (e.target.tagName || '').toLowerCase();
  if ((e.key === 'v' || e.key === 'V') && !['input', 'textarea', 'select'].includes(tag) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); S.screen === 'P16' ? preguntarVoz() : escucharGlobal(); }
});
API.alCambiar(async on => {
  pintarEstado();
  if (on) { const r = await API.sincronizar(); if (r) { aplicarPerfil(r.perfil); if (r.sincronizados) toast(`Conexión recuperada: ${r.sincronizados} combate(s) sincronizados`, 'ok'); if (!S.modal) render(); } }
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
EMO.activo = U.sonidos !== false;

(async function iniciar() {
  const hash = location.hash.slice(1);
  const mSala = hash.match(/sala=([A-Z0-9]{6})/i);
  if (/^P\d\d$/.test(hash)) S.screen = hash;
  else if (API.tieneSesion() || U.email) S.screen = 'P05';
  render();
  const salud = await API.salud();
  S.llm = salud ? salud.llm : null;
  pintarEstado(salud);
  if (salud && API.tieneSesion()) {
    try { aplicarPerfil(await API.perfil()); } catch (e) { /* se queda el perfil local */ }
    await sincronizarAhora(true);
  }
  if (salud) await refrescarEscenarios();
  if (mSala) {
    history.replaceState(null, '', location.pathname);
    if (API.tieneSesion()) return unirse(mSala[1].toUpperCase());
    pendienteSala = mSala[1].toUpperCase(); toast('Ingresa para unirte a la sala ' + pendienteSala); return go('P02');
  }
  render(); cargarDatos(S.screen);
})();
