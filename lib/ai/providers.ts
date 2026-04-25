import { AI_MODELS } from '@/lib/ai/model-config';

export function getModelId(): string {
  return `openai/${AI_MODELS.chat}`;
}

export function getProviderName(): string {
  return 'OpenAI';
}
