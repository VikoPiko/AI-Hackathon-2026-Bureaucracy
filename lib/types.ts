import { z } from 'zod';

// ============================================================
// BUREAUCRACYAI - SHARED TYPES (Source of Truth)
// All Zod schemas and TypeScript types must be imported from here
// ============================================================

// --- Procedure Answer (Chat Q&A) ---
export const SourceCitationSchema = z.object({
  title: z.string(),
  url: z.string().nullable(),
  kind: z.enum(['official', 'knowledge_base', 'document', 'web']),
  is_official: z.boolean(),
});
export type SourceCitation = z.infer<typeof SourceCitationSchema>;

export const ProcedureAnswerModelSchema = z.object({
  summary: z.string(),
  steps: z.array(z.string()),
  documents: z.array(z.string()),
  key_points: z.array(z.string()),
  checklist: z.array(z.string()),
  legal_basis: z.array(z.string()),
  covers: z.array(z.string()),
  not_covered: z.array(z.string()),
  eligibility: z.array(z.string()),
  prerequisites: z.array(z.string()),
  exceptions: z.array(z.string()),
  estimated_timeline: z.string().nullable(),
  timeline_details: z.array(z.string()),
  cost_breakdown: z.array(z.string()),
  risks: z.array(z.string()),
  positive_points: z.array(z.string()),
  missing_clauses: z.array(z.string()),
  common_mistakes: z.array(z.string()),
  scams_to_avoid: z.array(z.string()),
  what_not_to_do: z.array(z.string()),
  office: z.string().nullable(),
  fee_info: z.string().nullable(),
  source_url: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  answerable: z.boolean(),
  needs_more_context: z.boolean(),
  missing_context: z.array(z.string()),
  follow_up_questions: z.array(z.string()),
  related_procedures: z.array(z.string()),
});
export const ProcedureAnswerSchema = ProcedureAnswerModelSchema.extend({
  used_sources: z.array(SourceCitationSchema).optional(),
});
export type ProcedureAnswer = z.infer<typeof ProcedureAnswerSchema>;

// --- Document Risk Analysis ---
export const DocumentRiskModelSchema = z.object({
  risk_level: z.enum(['low', 'medium', 'high']),
  difficulty: z.enum(['easy', 'moderate', 'complex']),
  summary: z.string(),
  risks: z.array(z.object({
    clause: z.string(),
    risk: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    recommendation: z.string(),
  })),
  missing_clauses: z.array(z.string()),
  positive_points: z.array(z.string()),
  key_points: z.array(z.string()),
  checklist: z.array(z.string()),
  verdict: z.string(),
  confidence: z.number().min(0).max(1),
  needs_more_context: z.boolean(),
  missing_context: z.array(z.string()),
  follow_up_questions: z.array(z.string()),
});
export const DocumentRiskSchema = DocumentRiskModelSchema.extend({
  used_sources: z.array(SourceCitationSchema).optional(),
});
export type DocumentRisk = z.infer<typeof DocumentRiskSchema>;

// --- Relocation Journey ---
export const RelocationJourneySchema = z.object({
  title: z.string(),
  phases: z.array(z.object({
    phase: z.string(),
    timeline: z.string(),
    tasks: z.array(z.object({
      task: z.string(),
      urgency: z.enum(['critical', 'important', 'optional']),
      where: z.string().nullable(),
      estimated_time: z.string().nullable(),
    })),
  })),
  warnings: z.array(z.string()),
  estimated_total_cost: z.string().nullable(),
});
export type RelocationJourney = z.infer<typeof RelocationJourneySchema>;

// --- Country Comparison ---
export const CountryComparisonSchema = z.object({
  question_interpreted: z.string(),
  countries: z.array(z.object({
    country_code: z.string(),
    country_name: z.string(),
    summary: z.string(),
    processing_time: z.string().nullable(),
    typical_cost: z.string().nullable(),
    difficulty: z.enum(['easy', 'moderate', 'complex']),
    key_advantage: z.string().nullable(),
    key_disadvantage: z.string().nullable(),
  })),
  recommendation: z.string(),
});
export type CountryComparison = z.infer<typeof CountryComparisonSchema>;

// --- Procedure Summary (Browse Mode) ---
export const ProcedureSummarySchema = z.object({
  procedure_id: z.string(),
  title: z.string(),
  category: z.string(),
  country: z.string(),
  source_url: z.string(),
  difficulty: z.enum(['easy', 'moderate', 'complex']).optional(),
});
export type ProcedureSummary = z.infer<typeof ProcedureSummarySchema>;

// --- Enums and Constants ---
export type Country = 'BG' | 'DE' | 'NL' | 'PT' | 'ES' | 'FR' | 'PL' | 'CZ'
  | 'AT' | 'SE' | 'HR' | 'GR' | 'RO' | 'GE' | 'RS' | 'GB' | 'CH' | 'UA';
export type Language = 'en' | 'bg' | 'de' | 'nl' | 'pt' | 'es' | 'fr' | 'tr';
export type AppMode = 'chat' | 'browse' | 'upload' | 'analyze' | 'journey' | 'compare';

export const COUNTRY_NAMES: Record<string, string> = {
  BG: 'Bulgaria', DE: 'Germany', NL: 'Netherlands', PT: 'Portugal',
  ES: 'Spain', FR: 'France', PL: 'Poland', CZ: 'Czech Republic',
  AT: 'Austria', SE: 'Sweden', HR: 'Croatia', GR: 'Greece',
  RO: 'Romania', GE: 'Georgia', RS: 'Serbia', GB: 'United Kingdom',
  CH: 'Switzerland', UA: 'Ukraine',
};

export const COUNTRY_FLAGS: Record<string, string> = {
  BG: '🇧🇬', DE: '🇩🇪', NL: '🇳🇱', PT: '🇵🇹', ES: '🇪🇸', FR: '🇫🇷',
  PL: '🇵🇱', CZ: '🇨🇿', AT: '🇦🇹', SE: '🇸🇪', HR: '🇭🇷', GR: '🇬🇷',
  RO: '🇷🇴', GE: '🇬🇪', RS: '🇷🇸', GB: '🇬🇧', CH: '🇨🇭', UA: '🇺🇦',
};

export const CATEGORIES = [
  'address',           // Address registration
  'id_card',           // ID cards, passports
  'marriage',          // Marriage, civil partnerships
  'vehicle',           // Car registration, import
  'license',           // Driving licenses
  'residence_permit',  // Short and long-term residence
  'work_permit',       // Work authorization
  'business',          // Company registration
  'tax',               // Tax ID, registration, regimes
  'education',         // School, university, degree recognition
  'apostille',         // Document legalization
  'banking',           // Opening bank accounts
  'family',            // Family reunification
  'retirement',        // Pension, retirement visa
  'digital_nomad',     // Digital nomad visas
  'user_upload',       // User-uploaded documents
] as const;

// --- Demo Questions ---
export const DEMO_QUESTIONS = [
  {
    id: 'q1', mode: 'journey',
    prompt: { from_country: 'BR', to_country: 'DE', nationality: 'Brazilian', purpose: 'work' },
    label: 'Brazilian moving to Germany for work',
  },
  {
    id: 'q2', mode: 'chat',
    prompt: { question: "My Indian partner wants to join me in the Netherlands. What visa and permits does she need?", country: 'NL', language: 'en' },
    label: 'Partner visa Netherlands',
  },
  {
    id: 'q3', mode: 'chat',
    prompt: { question: "I want to retire in Portugal. I'm 61 and British. Tell me about the NHR tax regime and how to get a residence permit.", country: 'PT', language: 'en' },
    label: 'UK retirement to Portugal',
    hero: true,
  },
  {
    id: 'q4', mode: 'compare',
    prompt: { question: "Which EU country has the easiest and fastest work permit process for a non-EU software engineer?", countries: ['DE', 'NL', 'PT', 'ES'] },
    label: 'Best EU country for tech work permit',
  },
  {
    id: 'q5', mode: 'chat',
    prompt: { question: "I'm a US freelancer. Can I live in Georgia (the country) long-term legally? How does it work?", country: 'GE', language: 'en' },
    label: 'Digital nomad in Georgia',
  },
  {
    id: 'q6', mode: 'chat',
    prompt: { question: "I received an official letter from the German Ausländerbehörde. What do they typically want and what are my deadlines?", country: 'DE', language: 'en' },
    label: 'German official letter',
  },
  {
    id: 'q7', mode: 'analyze',
    document_type: 'rental', country: 'DE',
    label: 'German rental agreement risk check',
  },
  {
    id: 'q8', mode: 'analyze',
    document_type: 'employment', country: 'NL',
    label: 'Dutch employment contract check',
  },
  {
    id: 'q9', mode: 'chat',
    prompt: { question: "I want to bring my elderly mother to live with me in Spain under family reunification. What is the full process?", country: 'ES', language: 'en' },
    label: 'Family reunification Spain',
  },
  {
    id: 'q10', mode: 'chat',
    prompt: { question: "I'm Ukrainian living in Poland on temporary protection. What are my options for longer-term legal status?", country: 'PL', language: 'en' },
    label: 'Ukrainian in Poland - long-term status',
  },
] as const;
