import type { SourceCitation } from '@/lib/types';

interface WebSourceLike {
  title?: string;
  url?: string;
}

interface RagSourceLike {
  title?: string;
  source_url?: string;
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(/https?:\/\/[^\s)\]]+/i);
  return match?.[0] || (/^https?:\/\//i.test(trimmed) ? trimmed : null);
}

function matchesPreferredDomain(url: string | null, preferredDomains: string[]): boolean {
  if (!url || preferredDomains.length === 0) {
    return false;
  }

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

export function isOfficialSourceUrl(
  url: string | null | undefined,
  preferredDomains: string[],
): boolean {
  return matchesPreferredDomain(normalizeUrl(url), preferredDomains);
}

export function extractOfficialWebSources(
  sources: unknown[],
  preferredDomains: string[],
): Array<{ title: string; url: string }> {
  const official = sources.flatMap((source) => {
    if (!source || typeof source !== 'object') {
      return [];
    }

    const candidate = source as WebSourceLike;
    const url = normalizeUrl(candidate.url);
    if (!url || !matchesPreferredDomain(url, preferredDomains)) {
      return [];
    }

    return [{
      title: candidate.title || url,
      url,
    }];
  });

  const seen = new Set<string>();
  return official.filter((item) => {
    const key = `${item.title}|${item.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeSources(items: SourceCitation[]): SourceCitation[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.kind}|${item.url || ''}|${item.title}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function pickOfficialSourceUrl(
  preferredDomains: string[],
  candidates: Array<string | null | undefined>,
): string | null {
  const normalized = candidates
    .map((candidate) => normalizeUrl(candidate))
    .filter((value): value is string => Boolean(value));

  const official = normalized.find((url) => matchesPreferredDomain(url, preferredDomains));
  return official || null;
}

export function buildProcedureCitations(options: {
  preferredDomains: string[];
  ragMetadata: RagSourceLike[];
  ragSourceUrls: string[];
  webSources: unknown[];
  uploadedFileName?: string | null;
}): SourceCitation[] {
  const citations: SourceCitation[] = [];

  if (options.uploadedFileName) {
    citations.push({
      title: options.uploadedFileName,
      url: null,
      kind: 'document',
      is_official: false,
    });
  }

  options.ragMetadata.forEach((item, index) => {
    const url = normalizeUrl(item?.source_url || options.ragSourceUrls[index] || null);
    citations.push({
      title: item?.title || `Knowledge base source ${index + 1}`,
      url,
      kind: 'knowledge_base',
      is_official: matchesPreferredDomain(url, options.preferredDomains),
    });
  });

  options.webSources.forEach((source) => {
    if (!source || typeof source !== 'object') {
      return;
    }

    const candidate = source as WebSourceLike;
    const url = normalizeUrl(candidate.url);
    citations.push({
      title: candidate.title || url || 'Web result',
      url,
      kind: matchesPreferredDomain(url, options.preferredDomains) ? 'official' : 'web',
      is_official: matchesPreferredDomain(url, options.preferredDomains),
    });
  });

  return dedupeSources(citations).slice(0, 8);
}

export function buildDocumentCitations(options: {
  preferredDomains: string[];
  uploadedFileName?: string | null;
  fileUrl?: string | null;
  webSources: unknown[];
}): SourceCitation[] {
  const citations: SourceCitation[] = [];

  if (options.uploadedFileName) {
    citations.push({
      title: options.uploadedFileName,
      url: null,
      kind: 'document',
      is_official: false,
    });
  } else if (options.fileUrl) {
    citations.push({
      title: 'Uploaded document',
      url: normalizeUrl(options.fileUrl),
      kind: 'document',
      is_official: false,
    });
  }

  options.webSources.forEach((source) => {
    if (!source || typeof source !== 'object') {
      return;
    }

    const candidate = source as WebSourceLike;
    const url = normalizeUrl(candidate.url);
    citations.push({
      title: candidate.title || url || 'Web result',
      url,
      kind: matchesPreferredDomain(url, options.preferredDomains) ? 'official' : 'web',
      is_official: matchesPreferredDomain(url, options.preferredDomains),
    });
  });

  return dedupeSources(citations).slice(0, 8);
}
