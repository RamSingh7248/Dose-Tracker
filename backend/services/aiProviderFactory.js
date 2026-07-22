const { GoogleGenAI } = require("@google/genai");

// Base AI Provider Class
class BaseAIProvider {
  constructor(name, apiKey) {
    this.name = name;
    this.apiKey = apiKey;
  }

  async generateContent({ prompt, systemPrompt, options = {} }) {
    throw new Error(`generateContent not implemented for ${this.name}`);
  }
}

// 1. Google Gemini Provider
class GoogleGeminiProvider extends BaseAIProvider {
  constructor(apiKey) {
    super('gemini', apiKey || process.env.GEMINI_API_KEY);
  }

  async generateContent({ prompt, systemPrompt, options = {} }) {
    if (!this.apiKey) {
      throw new Error("Google Gemini API key not configured");
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const fullPrompt = `${systemPrompt ? `[SYSTEM CONTEXT]\n${systemPrompt}\n\n` : ''}${prompt}`;

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });

        if (response && response.text) {
          const approxTokens = Math.ceil((prompt.length + response.text.length) / 4);
          return {
            text: response.text,
            provider: 'gemini',
            model: modelName,
            tokensUsed: approxTokens,
            costEstimatedUsd: Number((approxTokens * 0.0000005).toFixed(6)),
          };
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("All Gemini models failed");
  }
}

// 2. OpenAI GPT Provider
class OpenAIGPTProvider extends BaseAIProvider {
  constructor(apiKey) {
    super('gpt', apiKey || process.env.OPENAI_API_KEY);
  }

  async generateContent({ prompt, systemPrompt, options = {} }) {
    if (!this.apiKey) {
      throw new Error("OpenAI GPT API key not configured");
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI API Error ${response.status}`);
    }

    const text = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || Math.ceil((prompt.length + text.length) / 4);

    return {
      text,
      provider: 'gpt',
      model: data.model || 'gpt-4o-mini',
      tokensUsed: tokens,
      costEstimatedUsd: Number((tokens * 0.0000015).toFixed(6)),
    };
  }
}

// 3. Anthropic Claude Provider
class AnthropicClaudeProvider extends BaseAIProvider {
  constructor(apiKey) {
    super('claude', apiKey || process.env.ANTHROPIC_API_KEY);
  }

  async generateContent({ prompt, systemPrompt, options = {} }) {
    if (!this.apiKey) {
      throw new Error("Anthropic Claude API key not configured");
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-5-sonnet-20241022',
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Anthropic API Error ${response.status}`);
    }

    const text = data.content?.[0]?.text || '';
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return {
      text,
      provider: 'claude',
      model: data.model || 'claude-3-5-sonnet',
      tokensUsed: tokens || Math.ceil((prompt.length + text.length) / 4),
      costEstimatedUsd: Number((tokens * 0.000003).toFixed(6)),
    };
  }
}

// 4. DeepSeek & Extensible Provider Adapters
class DeepSeekProvider extends BaseAIProvider {
  constructor(apiKey) {
    super('deepseek', apiKey || process.env.DEEPSEEK_API_KEY);
  }

  async generateContent({ prompt, systemPrompt, options = {} }) {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key not configured");
    }
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'deepseek-chat',
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `DeepSeek API Error ${response.status}`);
    }

    const text = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || Math.ceil((prompt.length + text.length) / 4);

    return {
      text,
      provider: 'deepseek',
      model: data.model || 'deepseek-chat',
      tokensUsed: tokens,
      costEstimatedUsd: Number((tokens * 0.0000003).toFixed(6)),
    };
  }
}

// Provider Factory Method
function getAIProvider(providerName = 'gemini') {
  const p = providerName.toLowerCase();
  switch (p) {
    case 'gpt':
    case 'openai':
      return new OpenAIGPTProvider();
    case 'claude':
    case 'anthropic':
      return new AnthropicClaudeProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    case 'gemini':
    case 'google':
    default:
      return new GoogleGeminiProvider();
  }
}

module.exports = {
  getAIProvider,
  GoogleGeminiProvider,
  OpenAIGPTProvider,
  AnthropicClaudeProvider,
  DeepSeekProvider,
};
