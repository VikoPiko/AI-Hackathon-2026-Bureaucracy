const CURRENT_INFO_HINTS = [
  'current',
  'latest',
  'today',
  'now',
  'updated',
  'official',
  '2025',
  '2026',
];

const GOVERNMENT_DOMAINS: Record<string, string[]> = {
  AT: ['oesterreich.gv.at', 'bmi.gv.at', 'help.gv.at'],
  BG: ['egov.bg', 'mvr.bg', 'gov.bg'],
  CH: ['ch.ch', 'sem.admin.ch', 'eda.admin.ch'],
  CZ: ['gov.cz', 'mvcr.cz', 'mpsv.cz'],
  DE: ['bund.de', 'bamf.de', 'auswaertiges-amt.de', 'service.berlin.de', 'make-it-in-germany.com'],
  ES: ['administracion.gob.es', 'inclusion.gob.es', 'extranjeros.inclusion.gob.es'],
  FR: ['service-public.fr', 'interieur.gouv.fr', 'france-visas.gouv.fr'],
  GB: ['gov.uk'],
  GE: ['gov.ge', 'sda.gov.ge'],
  GR: ['gov.gr', 'migration.gov.gr'],
  HR: ['gov.hr', 'mup.gov.hr'],
  NL: ['government.nl', 'ind.nl', 'rijksoverheid.nl'],
  PL: ['gov.pl', 'mos.cudzoziemcy.gov.pl'],
  PT: ['gov.pt', 'aima.gov.pt', 'eportugal.gov.pt'],
  RO: ['gov.ro', 'igi.mai.gov.ro'],
  RS: ['euprava.gov.rs', 'mup.gov.rs'],
  SE: ['sweden.se', 'migrationsverket.se', 'skatteverket.se'],
  UA: ['gov.ua', 'mfa.gov.ua'],
};

export function shouldUseGovernmentWebSearch(options: {
  question: string;
  ragConfidence: number;
  ragChunkCount: number;
  hasDocument: boolean;
}): boolean {
  const question = options.question.toLowerCase();

  if (options.hasDocument) {
    return true;
  }

  if (options.ragChunkCount === 0 || options.ragConfidence < 0.68) {
    return true;
  }

  return CURRENT_INFO_HINTS.some((hint) => question.includes(hint));
}

export function getGovernmentDomains(country: string): string[] | undefined {
  const domains = GOVERNMENT_DOMAINS[country];
  return domains && domains.length > 0 ? domains : undefined;
}

export function pickBestSourceUrl(
  currentSourceUrl: string | null | undefined,
  sources: unknown[],
): string | null {
  if (currentSourceUrl) {
    return currentSourceUrl;
  }

  const firstUrlSource = sources.find((source) => {
    if (!source || typeof source !== 'object') {
      return false;
    }

    return (
      'url' in source &&
      typeof (source as { url?: string }).url === 'string' &&
      ((source as { url?: string }).url?.length || 0) > 0
    );
  }) as { url?: string } | undefined;

  return firstUrlSource?.url || null;
}
