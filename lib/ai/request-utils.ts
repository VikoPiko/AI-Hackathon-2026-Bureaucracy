import type { Language } from '@/lib/types';

const DEFAULT_LANGUAGE: Language = 'en';

export function normalizeRequestText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function inferLanguageFromText(question: string): Language {
  const normalized = question.trim();
  const lower = normalized.toLowerCase();

  if (/\p{Script=Cyrillic}/u.test(normalized)) {
    return 'bg';
  }

  if (
    /[ğüşıöçİĞÜŞÖÇ]/u.test(normalized) ||
    /\b(ve|icin|için|ikamet|oturma|izni|basvuru|başvuru)\b/u.test(lower)
  ) {
    return 'tr';
  }

  if (
    /[ñ¿¡áéíóú]/u.test(normalized) ||
    /\b(el|la|los|las|para|permiso|residencia|empadronamiento|cita)\b/u.test(lower)
  ) {
    return 'es';
  }

  if (
    /[àâçéèêëîïôùûüÿœæ]/u.test(normalized) ||
    /\b(le|la|les|pour|titre|sejour|séjour|préfecture)\b/u.test(lower)
  ) {
    return 'fr';
  }

  if (
    /[äöüß]/u.test(normalized) ||
    /\b(der|die|das|und|anmeldung|aufenthalt|bürgeramt)\b/u.test(lower)
  ) {
    return 'de';
  }

  if (
    /[ãõçáàâêéíóôú]/u.test(normalized) ||
    /\b(para|residencia|autorizacao|autorização|cartao|cartão)\b/u.test(lower)
  ) {
    return 'pt';
  }

  if (
    /\b(het|een|gemeente|verblijf|vergunning|aanvraag)\b/u.test(lower)
  ) {
    return 'nl';
  }

  return DEFAULT_LANGUAGE;
}
