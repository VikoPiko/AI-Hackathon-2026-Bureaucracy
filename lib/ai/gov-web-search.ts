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

const GLOBAL_OFFICIAL_DOMAINS = ['europa.eu'];

const GOVERNMENT_DOMAINS: Record<string, string[]> = {
  AT: ['oesterreich.gv.at', 'bmi.gv.at', 'help.gv.at'],
  BG: ['egov.bg', 'mvr.bg', 'gov.bg'],
  CH: ['ch.ch', 'sem.admin.ch', 'eda.admin.ch'],
  CZ: ['gov.cz', 'mvcr.cz', 'mpsv.cz'],
  DE: [
    'bund.de',
    'bamf.de',
    'bundesamt-fuer-migration-und-fluechtlinge.de',
    'bundesagentur-fuer-arbeit.de',
    'auswaertiges-amt.de',
    'diplo.de',
    'berlin.de',
    'service.berlin.de',
    'make-it-in-germany.com',
  ],
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
  const merged = [...(domains || []), ...GLOBAL_OFFICIAL_DOMAINS];
  return merged.length > 0 ? merged : undefined;
}

function normalizeUrlCandidate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(/https?:\/\/[^\s)\]]+/i);
  if (match?.[0]) {
    return match[0];
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function matchesPreferredDomain(url: string, preferredDomains: string[]): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return preferredDomains.some((domain) => {
      const normalized = domain.toLowerCase();
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

export function pickBestSourceUrl(
  currentSourceUrl: string | null | undefined,
  sources: unknown[],
  preferredDomains: string[] = [],
): string | null {
  const candidates = [
    normalizeUrlCandidate(currentSourceUrl),
    ...sources
      .map((source) => {
        if (!source || typeof source !== 'object') {
          return null;
        }

        return 'url' in source
          ? normalizeUrlCandidate((source as { url?: string }).url)
          : null;
      })
      .filter((value): value is string => Boolean(value)),
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

  if (candidates.length === 0) {
    return null;
  }

  const preferredCandidate =
    preferredDomains.length > 0
      ? candidates.find((url) => matchesPreferredDomain(url, preferredDomains))
      : null;

  if (preferredCandidate) {
    return preferredCandidate;
  }

  if (preferredDomains.length > 0) {
    return null;
  }

  return candidates[0];
}
