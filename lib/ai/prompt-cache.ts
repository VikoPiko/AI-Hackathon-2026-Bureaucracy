import { PROMPT_VERSION } from '@/lib/prompts';

function supportsExtendedPromptCaching(modelId: string): boolean {
  return /^gpt-4\.1($|-)/.test(modelId) || /^gpt-5([.-]|$)/.test(modelId);
}

function compactSegment(value: string | undefined, fallback: string, maxLength = 12): string {
  const normalized = (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (normalized || fallback).slice(0, maxLength);
}

export function getPromptCacheOptions(options: {
  modelId: string;
  family: 'chat' | 'analyze' | 'journey' | 'compare';
  country?: string;
  language?: string;
  documentType?: string;
}): {
  promptCacheKey: string;
  promptCacheRetention: 'in_memory' | '24h';
} {
  const familyCode: Record<typeof options.family, string> = {
    chat: 'c',
    analyze: 'a',
    journey: 'j',
    compare: 'cmp',
  };
  const versionCode = PROMPT_VERSION.replace('formwise-', 'fw-').slice(-16);
  const cacheKey = [
    'fw',
    compactSegment(versionCode, 'v1', 16),
    familyCode[options.family],
    compactSegment(options.country, 'global', 6),
    compactSegment(options.language, 'any', 6),
    compactSegment(options.documentType, 'generic', 12),
  ]
    .join(':')
    .slice(0, 64);

  return {
    promptCacheKey: cacheKey,
    promptCacheRetention: supportsExtendedPromptCaching(options.modelId)
      ? '24h'
      : 'in_memory',
  };
}
