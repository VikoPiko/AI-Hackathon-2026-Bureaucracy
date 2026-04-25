import { getPromptCacheOptions } from '@/lib/ai/prompt-cache';

export type AiTaskFamily = 'chat' | 'search' | 'analyze' | 'journey' | 'compare';

export const AI_MODELS: Record<AiTaskFamily, string> = {
  chat: process.env.OPENAI_CHAT_MODEL || 'gpt-5.5',
  search: process.env.OPENAI_SEARCH_MODEL || 'gpt-5.4-mini',
  analyze: process.env.OPENAI_ANALYZE_MODEL || 'gpt-5.4',
  journey: process.env.OPENAI_JOURNEY_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-5.5',
  compare: process.env.OPENAI_COMPARE_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-5.5',
};

export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export function supportsTemperatureControl(modelId: string): boolean {
  return !/^gpt-5([.-]|$)/.test(modelId);
}

export function getReasoningEffort(
  modelId: string,
): 'low' | 'medium' | 'high' | undefined {
  if (/^gpt-5(\.|-|$)/.test(modelId) || /^o[1-9]/.test(modelId)) {
    return /^gpt-5\.4-mini($|-)/.test(modelId) ? 'low' : 'medium';
  }

  return undefined;
}

export function getTextVerbosity(
  modelId: string,
  preferred: 'low' | 'medium' | 'high' = 'high',
): 'low' | 'medium' | 'high' | undefined {
  if (!/^gpt-5(\.|-|$)/.test(modelId)) {
    return undefined;
  }

  return /^gpt-5\.4-mini($|-)/.test(modelId) ? 'medium' : preferred;
}

export function getOpenAIProviderOptions(options: {
  modelId: string;
  family: Exclude<AiTaskFamily, 'search'> | 'chat';
  country?: string;
  language?: string;
  documentType?: string;
  promptCacheSuffix?: string;
  textVerbosity?: 'low' | 'medium' | 'high';
}) {
  const promptCache = getPromptCacheOptions({
    modelId: options.modelId,
    family: options.family,
    country: options.country,
    language: options.language,
    documentType: options.documentType,
  });

  return {
    store: false,
    reasoningEffort: getReasoningEffort(options.modelId),
    textVerbosity: getTextVerbosity(options.modelId, options.textVerbosity),
    promptCacheKey: `${promptCache.promptCacheKey}${options.promptCacheSuffix || ''}`.slice(
      0,
      64,
    ),
    promptCacheRetention: promptCache.promptCacheRetention,
  };
}
