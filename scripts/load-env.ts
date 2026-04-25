import { existsSync, readFileSync } from 'fs';
import path from 'path';

export function loadLocalEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf-8');
  const parsed: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) {
      process.env[key] = key === 'CHROMA_URL' ? normalizeUrl(value) : value;
    }
  }
}

function normalizeUrl(value: string): string {
  if (!value) {
    return value;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.includes('localhost') || value.includes('127.0.0.1')) {
    return `http://${value}`;
  }

  return `https://${value}`;
}
