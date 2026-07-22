const { getAIProvider } = require('./aiProviderFactory');

const DEFAULT_CASCADE = ['gemini', 'gpt', 'claude', 'deepseek'];

/**
 * Smart AI Router with Failover Cascade
 * Primary Provider -> Secondary -> Tertiary -> Local Clinical NLP Fallback
 */
async function executeAIRoute({ primaryProvider = 'gemini', prompt, systemPrompt, options = {}, localFallbackFn }) {
  // Build dynamic priority list with primaryProvider at index 0
  const cascade = [
    primaryProvider.toLowerCase(),
    ...DEFAULT_CASCADE.filter(p => p !== primaryProvider.toLowerCase())
  ];

  const failoverTrace = [];

  for (const providerName of cascade) {
    try {
      const provider = getAIProvider(providerName);
      const result = await provider.generateContent({ prompt, systemPrompt, options });

      return {
        ...result,
        wasFailover: providerName !== primaryProvider.toLowerCase(),
        failoverTrace,
        status: providerName === primaryProvider.toLowerCase() ? 'SUCCESS' : 'FAILOVER_SUCCESS',
      };
    } catch (err) {
      failoverTrace.push({
        provider: providerName,
        error: err.message || 'Provider call failed',
        timestamp: new Date(),
      });
    }
  }

  // If all API providers failed, execute local Clinical Healthcare NLP Engine
  if (typeof localFallbackFn === 'function') {
    const fallbackText = localFallbackFn(prompt);
    return {
      text: fallbackText,
      provider: 'local_clinical_nlp',
      model: 'DoseTracker-LocalClinicalEngine-v1.0',
      tokensUsed: Math.ceil((prompt.length + fallbackText.length) / 4),
      costEstimatedUsd: 0.000000,
      wasFailover: true,
      failoverTrace,
      status: 'FALLBACK_LOCAL',
    };
  }

  throw new Error(`All AI providers (${cascade.join(', ')}) failed to generate content.`);
}

module.exports = { executeAIRoute };
