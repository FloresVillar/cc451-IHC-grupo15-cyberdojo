// Adaptadores de proveedores LLM. Todos exponen la misma firma:
//   completar({ sistema, prompt, json }, env, signal) -> Promise<string>
// Cambiar de proveedor = cambiar LLM_PROVIDER en .env (RF04, RNF08).

async function postJSON(url, headers, body, signal, nombre) {
  let r;
  try {
    r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
  } catch (e) {
    if (signal && signal.aborted) throw e;
    throw new Error(`${nombre}: no se pudo conectar (${e.cause?.code || e.message}). Revisa tu internet o firewall${nombre === 'ollama' ? ', y que Ollama esté abierto' : ''}.`);
  }
  if (!r.ok) {
    // Se incluye el mensaje del proveedor (clave inválida, modelo inexistente, límite de uso...) para poder diagnosticar.
    let detalle = '';
    try { const t = await r.text(); const j = JSON.parse(t); detalle = (j.error && (j.error.message || j.error)) || t; } catch { /* sin cuerpo */ }
    const pista = { 400: 'revisa LLM_MODEL y la clave', 401: 'API key inválida', 403: 'API key sin permiso o región no habilitada', 404: 'el modelo no existe: cambia LLM_MODEL', 429: 'límite de uso alcanzado: espera o usa otra key' }[r.status] || '';
    throw new Error(`${nombre} HTTP ${r.status}${pista ? ' (' + pista + ')' : ''}: ${String(detalle).slice(0, 200)}`);
  }
  return r.json();
}

export const anthropic = {
  modeloPorDefecto: 'claude-haiku-5-5',
  async completar({ sistema, prompt }, env, signal) {
    if (!env.ANTHROPIC_API_KEY) throw new Error('anthropic: falta ANTHROPIC_API_KEY');
    const d = await postJSON('https://api.anthropic.com/v1/messages',
      { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      { model: env.LLM_MODEL || this.modeloPorDefecto, max_tokens: 1200, system: sistema, messages: [{ role: 'user', content: prompt }] },
      signal, 'anthropic');
    return d.content.map(c => c.text || '').join('');
  },
};

// Sirve para OpenAI y para cualquier API compatible (Groq, OpenRouter, LM Studio, vLLM)
// cambiando OPENAI_BASE_URL.
export const openai = {
  modeloPorDefecto: 'gpt-4o-mini',
  async completar({ sistema, prompt, json }, env, signal, nombre = 'openai') {
    if (!env.OPENAI_API_KEY) throw new Error(`${nombre}: falta la API key`);
    const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const d = await postJSON(`${base}/chat/completions`, { authorization: `Bearer ${env.OPENAI_API_KEY}` }, {
      model: env.LLM_MODEL || this.modeloPorDefecto,
      messages: [{ role: 'system', content: sistema || '' }, { role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }, signal, nombre);
    return d.choices[0].message.content;
  },
};

// Atajo para Groq (API compatible con OpenAI, capa gratuita y muy rápida).
// Equivale a LLM_PROVIDER=openai + OPENAI_BASE_URL=https://api.groq.com/openai/v1
export const groq = {
  modeloPorDefecto: 'llama-3.3-70b-versatile',
  completar(peticion, env, signal) {
    if (!env.GROQ_API_KEY) throw new Error('groq: falta GROQ_API_KEY');
    return openai.completar(peticion, { ...env, OPENAI_API_KEY: env.GROQ_API_KEY,
      OPENAI_BASE_URL: env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1', LLM_MODEL: env.LLM_MODEL || this.modeloPorDefecto }, signal, 'groq');
  },
};

export const gemini = {
  // Alias que Google mantiene apuntando al Flash vigente (los 2.5 se apagaron el 16/10/2026).
  modeloPorDefecto: 'gemini-flash-latest',
  async completar({ sistema, prompt, json }, env, signal) {
    if (!env.GEMINI_API_KEY) throw new Error('gemini: falta GEMINI_API_KEY');
    const modelo = env.LLM_MODEL || this.modeloPorDefecto;
    const d = await postJSON(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${env.GEMINI_API_KEY}`, {}, {
      systemInstruction: { parts: [{ text: sistema || '' }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: json ? { responseMimeType: 'application/json' } : {},
    }, signal, 'gemini');
    return d.candidates[0].content.parts.map(p => p.text || '').join('');
  },
};

// Modelo local: no sale nada de la laptop (útil por privacidad y sin costo).
export const ollama = {
  modeloPorDefecto: 'llama3.1',
  async completar({ sistema, prompt, json }, env, signal) {
    const d = await postJSON(`${(env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '')}/api/generate`, {}, {
      model: env.LLM_MODEL || this.modeloPorDefecto, system: sistema, prompt, stream: false, ...(json ? { format: 'json' } : {}),
    }, signal, 'ollama');
    return d.response;
  },
};

// Proveedor simulado: siempre "falla", así el gateway usa el banco de escenarios y las
// reglas locales. Sirve para desarrollar y para la demo sin API key ni internet.
export const mock = {
  modeloPorDefecto: '-',
  async completar() { throw new Error('mock: sin LLM, se usa el banco y las reglas'); },
};

export const PROVEEDORES = { anthropic, openai, groq, gemini, ollama, mock };
