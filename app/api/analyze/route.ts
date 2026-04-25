import { generateObject } from 'ai';
import { z } from 'zod';
import { DocumentRiskSchema, COUNTRY_NAMES } from '@/lib/types';
import { getModelId } from '@/lib/ai/providers';
import { extractTextFromUrl } from '@/lib/extract';

// Legal standards per country per document type
const LEGAL_STANDARDS: Record<string, Record<string, string>> = {
  DE: {
    rental:
      'German BGB rental law: max deposit = 3 months cold rent (Kaltmiete). Minimum notice period = 3 months for tenant, varies for landlord. Landlord must give 24h advance notice before entering. Mietpreisbremse caps rent in many cities. Wohnungsgeberbestätigung required for address registration.',
    employment:
      'German employment law (KSchG): minimum wage €12.41/hr. Probation (Probezeit) max 6 months. After 6 months in companies with 10+ employees, dismissal requires valid reason. Written termination required. Paid vacation: minimum 20 days (24 days based on 6-day week).',
    official_letter:
      'German administrative law: deadlines in official letters are strict and legally binding. Widerspruch (appeal) typically within 1 month. Ignoring official letters may result in automatic decisions against you.',
  },
  NL: {
    rental:
      'Dutch rental law: deposit max 2 months. Landlord must return deposit within 14 days of lease end. Annual rent increases capped by government index. Tenant has right to rental commission (huurcommissie) arbitration. Service costs must be itemized.',
    employment:
      'Dutch Wet op de arbeidsovereenkomst: 30% ruling (belastingvoordeel) available for highly skilled migrants earning above €46,107. Transition payment (transitievergoeding) = 1/3 month salary per year served, due on dismissal. Probation max 2 months for contracts over 6 months. Minimum 20 vacation days.',
  },
  PT: {
    rental:
      'Portuguese NRAU rental law: minimum 1-year contract for residential rental. Annual increases tied to official inflation index. Landlord needs 120 days notice to terminate for own use. Tenant deposit typically 1-2 months, no legal max set. Alojamento local (short-term) different rules.',
    employment:
      'Portuguese Código do Trabalho: 13th month (Natal) and 14th month (Férias) salary mandatory. Minimum 22 vacation days. Dismissal requires just cause (justa causa) or collective redundancy process. Sindicalização (union) rights protected.',
  },
  ES: {
    rental:
      'Spanish LAU rental law: minimum 5-year contract for individual landlords (7 years for companies). Annual increases capped at CPI. Deposit max 2 months (fianza). Tenant may leave after 6 months with 30 days written notice. Landlord must declare deposit to regional authority.',
    employment:
      'Spanish Estatuto de los Trabajadores: dismissal compensation = 33 days salary per year (unfair) or 20 days (fair/redundancy). Maximum 40 hours/week, overtime max 80/year. Minimum 30 calendar days annual leave. Social security (Seguridad Social) registration mandatory.',
  },
  FR: {
    rental:
      'French law Alur/Elan: deposit max 1 month cold rent for unfurnished, 2 months for furnished. Landlord must return deposit within 1 month (no damage) or 2 months (with damage). Minimum notice: 3 months for tenant (1 month in certain zones). Encadrement des loyers caps rent in Paris and some cities.',
    employment:
      'French Code du Travail: 35-hour work week standard. Minimum 5 weeks paid vacation. Indefinite contract (CDI) is the norm; fixed-term (CDD) has strict limits. Licenciement requires just cause and formal procedure. Arrêt maladie (sick leave) covered by Sécurité Sociale.',
  },
};

const DEFAULT_STANDARDS =
  'Apply general European contract law standards. Flag any clause that appears one-sided, waives standard legal rights, or imposes unusual obligations on the weaker party.';

const analyzeRequestSchema = z.object({
  text: z.string().trim().min(1).optional(),
  file_url: z.string().url().optional(),
  document_type: z.string().trim().min(1).max(100).default('contract'),
  country: z.string().trim().length(2).toUpperCase().default('DE'),
}).refine((data) => Boolean(data.text || data.file_url), {
  message: 'Either text or file_url is required',
  path: ['text'],
});

export async function POST(req: Request) {
  try {
    const payload = analyzeRequestSchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json(
        {
          error: 'Invalid request payload',
          details: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { text, file_url, document_type, country } = payload.data;

    let documentText = text;
    if (!documentText && file_url) {
      documentText = await extractTextFromUrl(file_url);
    }

    if (!documentText) {
      return Response.json(
        { error: 'No document text provided' },
        { status: 400 },
      );
    }

    const standards =
      LEGAL_STANDARDS[country]?.[document_type] || DEFAULT_STANDARDS;

    const { object } = await generateObject({
      model: getModelId(),
      schema: DocumentRiskSchema,
      system: `You are a legal document analyst specializing in ${
        COUNTRY_NAMES[country] || country
      } contracts and official documents.
Your users are expats and foreigners who uploaded documents they cannot fully understand - often before signing.

Legal standards to apply for ${COUNTRY_NAMES[country] || country}:
${standards}

Your job:
- Identify every risky, unfair, or legally questionable clause - quote or closely paraphrase the problematic text
- Flag standard legal protections that are absent but should be there
- Note genuinely positive or well-drafted clauses
- Severity: HIGH = illegal clause or waives statutory rights | MEDIUM = below standard, should negotiate | LOW = worth noting
- verdict: one plain-English sentence bottom line for someone deciding whether to sign

CRITICAL: Always respond in English, even if the document is in another language.
Output ONLY the JSON object. No preamble. No markdown.`,
      prompt: `Document type: ${document_type}
Country jurisdiction: ${COUNTRY_NAMES[country] || country}

Document text:
${documentText.slice(0, 10000)}`,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Analyze route error:', error);
    return Response.json(
      { error: 'Failed to analyze document' },
      { status: 500 },
    );
  }
}
