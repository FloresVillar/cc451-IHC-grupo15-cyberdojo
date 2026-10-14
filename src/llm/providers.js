// Adaptadores. Cada uno expone completar(prompt, env) -> Promise<string>.
export const anthropic = {
  async completar(prompt, env) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.LLM_MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    return (await r.json()).content[0].text;
  },
};

export const openai = {
  async completar(prompt, env) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: env.LLM_MODEL, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`openai ${r.status}`);
    return (await r.json()).choices[0].message.content;
  },
};

export const ollama = {
  async completar(prompt, env) {
    const r = await fetch(`${env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.LLM_MODEL || 'llama3.1', prompt, stream: false, format: 'json' }),
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    return (await r.json()).response;
  },
};

// Proveedor simulado: sirve para desarrollar y probar sin API key.
export const mock = {
  async completar() { throw new Error('mock: usar banco de escenarios'); },
};
