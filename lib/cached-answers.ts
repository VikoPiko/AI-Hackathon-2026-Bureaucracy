import type {
  CountryComparison,
  DocumentRisk,
  ProcedureAnswer,
  RelocationJourney,
} from '@/lib/types';
import { DEMO_QUESTIONS as demoQuestions } from '@/lib/types';

export const CACHED_CHAT_ANSWERS: Record<string, ProcedureAnswer> = {
  q2: {
    summary:
      "Your Indian partner can join you in the Netherlands under family reunification. You act as sponsor, must meet income and housing requirements, and the IND handles the case.",
    steps: [
      'Confirm you qualify as sponsor with a valid Dutch residence status, stable income, and adequate housing.',
      'Collect the partner documents: passport, marriage evidence, birth certificate, and criminal record documents with apostille and translation.',
      'Apply for the MVV entry visa through the Dutch embassy in India and then complete the residence permit process with the IND after arrival.',
      'Register the partner with the local Gemeente after arrival and complete biometrics with the IND.',
    ],
    documents: [
      "Sponsor's residence permit or Dutch passport",
      "Sponsor's recent payslips and employment contract",
      "Partner's passport",
      'Apostilled marriage certificate and birth certificate',
      'Criminal record declaration',
      'Proof of housing',
      'IND application form',
    ],
    office: 'IND (Immigratie- en Naturalisatiedienst)',
    fee_info: 'MVV visa about EUR 219, residence permit about EUR 192.',
    source_url: 'https://ind.nl/en/family/pages/partner.aspx',
    confidence: 0.92,
    answerable: true,
  },
  q3: {
    summary:
      'A British retiree can usually relocate to Portugal with the D7 passive income route and then apply for Portuguese tax residency. The original NHR regime is part of the tax conversation, but the residence path itself is the D7 route.',
    steps: [
      'Get a Portuguese NIF and open a Portuguese bank account first.',
      'Prepare D7 documents showing passive income, passport, criminal record, and accommodation.',
      'Apply for the D7 visa through the Portuguese consulate in the UK, then convert it to a residence permit in Portugal.',
      'Register tax residency and handle the applicable Portuguese tax regime through Financas.',
    ],
    documents: [
      'Valid British passport',
      'Police clearance certificate',
      'Proof of pension or passive income',
      'Portuguese NIF',
      'Proof of accommodation',
      'Portuguese bank statement',
      'Health insurance',
    ],
    office: 'Portuguese Consulate, AIMA, and Financas',
    fee_info: 'D7 visa about GBP 75, residence permit about EUR 83.',
    source_url:
      'https://portaldascomunidades.mne.gov.pt/en/vai-para-portugal/visto-d7',
    confidence: 0.95,
    answerable: true,
  },
  q5: {
    summary:
      'Georgia allows many nationalities, including US citizens, to stay visa-free for up to 365 days, making it a strong long-stay option for digital nomads.',
    steps: [
      'Enter Georgia with a valid US passport and use the visa-free stay.',
      'If staying long term, register an address for practical tasks like banking and rentals.',
      'Open a bank account with a local bank such as TBC or Bank of Georgia.',
      'Check Georgian tax consequences if you spend 183 or more days in the country.',
    ],
    documents: [
      'Valid US passport',
      'Proof of accommodation',
      'Local phone number for banking',
      'Health insurance',
      'Proof of income for banking or rentals',
    ],
    office: 'Public Service Hall, local banks, and Civil Registry if needed',
    fee_info: 'Visa-free entry is free; address registration is low cost.',
    source_url: 'https://geoconsul.gov.ge/en/visaInfo',
    confidence: 0.93,
    answerable: true,
  },
  q6: {
    summary:
      "A letter from the German Auslanderbehorde is legally important. Missing deadlines can affect residence status, so the safe default is to respond within the stated deadline and keep proof of submission.",
    steps: [
      'Identify the deadline, case number, and exact request in the letter.',
      'Get translation help immediately if you cannot read the letter in German.',
      'Prepare the requested documents and submit them before the deadline using a trackable method.',
      'Ask for an extension or legal advice promptly if the notice concerns a rejection, hearing, or serious status issue.',
    ],
    documents: [
      'Original letter',
      'Current residence permit',
      'Passport',
      'Requested supporting documents',
      'Address registration confirmation',
    ],
    office: 'Auslanderbehorde in the relevant German city',
    fee_info: 'Replying is generally free; permit-related fees vary.',
    source_url:
      'https://www.bamf.de/EN/Themen/MigrationAufenthalt/migrationaufenthalt-node.html',
    confidence: 0.88,
    answerable: true,
  },
  q9: {
    summary:
      "Spain's family reunification route can allow you to bring an elderly parent if you already have sufficient legal residence, income, and housing in Spain.",
    steps: [
      'Confirm you have held legal residence long enough and that your permit remains valid long enough to sponsor.',
      'Collect proof of income and suitable housing, including any local habitability report required.',
      "Gather the parent's passport, relationship evidence, criminal record, and medical documentation.",
      'File the family reunification request with the Oficina de Extranjeria and then complete the visa and TIE steps after approval.',
    ],
    documents: [
      "Sponsor's TIE",
      'Bank statements',
      'Housing report',
      'Lease or deed',
      "Parent's passport",
      'Birth certificate',
      'Criminal record certificate',
      'Medical certificate',
      'EX-02 form',
    ],
    office:
      "Oficina de Extranjeria, Spanish consulate, and police office for the TIE",
    fee_info: 'Application and card fees are relatively low; consular fees vary.',
    source_url:
      'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/hoja093/index.html',
    confidence: 0.9,
    answerable: true,
  },
  q10: {
    summary:
      'A Ukrainian in Poland on temporary protection can usually work and stay legally now, but should consider a more stable route such as a temporary residence and work permit, family-based residence, or later permanent residence.',
    steps: [
      'Confirm your current PESEL UKR and temporary protection status.',
      'Use an employer-sponsored temporary residence and work permit if you are employed.',
      'Check whether family reunification or Karta Polaka eligibility applies.',
      'Prepare for a later long-term path, including language study and a future permanent residence application.',
    ],
    documents: [
      'Ukrainian passport',
      'PESEL confirmation',
      'Proof of address in Poland',
      'Employment contract or employer declaration',
      'Photos',
      'Health insurance proof',
      'Residence permit application form',
    ],
    office: 'Urzad Wojewodzki in the relevant voivodeship',
    fee_info: 'Temporary residence application about PLN 340 plus card fee.',
    source_url:
      'https://www.gov.pl/web/mswia-en/temporary-protection-for-ukrainian-citizens',
    confidence: 0.87,
    answerable: true,
  },
};

export const CACHED_JOURNEY_ANSWERS: Record<string, RelocationJourney> = {
  q1: {
    title: 'Brazilian Moving to Germany for Work - Complete Relocation Roadmap',
    phases: [
      {
        phase: 'Before you leave',
        timeline: '2-6 months before departure',
        tasks: [
          {
            task: 'Secure a German job offer and confirm the work-visa route.',
            urgency: 'critical',
            where: 'German employer and German consulate process',
            estimated_time: '1-3 months',
          },
          {
            task: 'Start degree recognition, translations, and apostilles for Brazilian documents.',
            urgency: 'critical',
            where: 'Anabin, sworn translators, and Brazilian apostille offices',
            estimated_time: '4-12 weeks',
          },
          {
            task: 'Arrange health insurance and basic arrival banking setup.',
            urgency: 'important',
            where: 'Employer, German insurers, or international banking tools',
            estimated_time: '1 week',
          },
        ],
      },
      {
        phase: 'First week in Germany',
        timeline: 'Days 1-7',
        tasks: [
          {
            task: 'Register your address and obtain the landlord confirmation form.',
            urgency: 'critical',
            where: 'Burgeramt or Einwohnermeldeamt',
            estimated_time: '1-2 hours',
          },
          {
            task: 'Book the Auslanderbehorde appointment immediately.',
            urgency: 'critical',
            where: 'Local Auslanderbehorde',
            estimated_time: 'Same day booking; appointment may take weeks',
          },
          {
            task: 'Set up a German phone number for everyday admin.',
            urgency: 'important',
            where: 'Telekom, Vodafone, or O2',
            estimated_time: '30 minutes',
          },
        ],
      },
      {
        phase: 'First month',
        timeline: 'Weeks 2-4',
        tasks: [
          {
            task: 'Open a German bank account once registration is complete.',
            urgency: 'critical',
            where: 'N26, DKB, Deutsche Bank, or Sparkasse',
            estimated_time: '1 day to 1 week',
          },
          {
            task: 'Complete health insurance enrollment through your employer.',
            urgency: 'critical',
            where: 'Employer HR and statutory insurer',
            estimated_time: '1-2 weeks',
          },
          {
            task: 'Watch for your tax ID and start routine local registrations.',
            urgency: 'important',
            where: 'Automatic by post and local providers',
            estimated_time: '2-4 weeks',
          },
        ],
      },
      {
        phase: 'First 3 months',
        timeline: 'Months 2-3',
        tasks: [
          {
            task: 'Attend the residence permit appointment with the full document set.',
            urgency: 'critical',
            where: 'Auslanderbehorde',
            estimated_time: '2-4 hours',
          },
          {
            task: 'Continue German language learning and medium-term integration steps.',
            urgency: 'important',
            where: 'BAMF-approved course providers',
            estimated_time: 'Ongoing',
          },
          {
            task: 'Review optional local admin such as license exchange if relevant.',
            urgency: 'optional',
            where: 'Local driving license authority',
            estimated_time: '2-4 weeks',
          },
        ],
      },
    ],
    warnings: [
      'Book the Auslanderbehorde appointment immediately because wait times can be severe.',
      'Do not rely on accommodation that will not issue the landlord confirmation needed for Anmeldung.',
      'Start recognition and translation work in Brazil early because it often takes longer than expected.',
    ],
    estimated_total_cost:
      'EUR 2,000-EUR 5,000 for visa, document prep, deposits, and first-month setup.',
  },
};

export const CACHED_COMPARISON_ANSWERS: Record<string, CountryComparison> = {
  q4: {
    question_interpreted:
      'Best EU country for work permit processing speed and simplicity for a non-EU software engineer',
    countries: [
      {
        country_code: 'DE',
        country_name: 'Germany',
        summary:
          "Germany's EU Blue Card is strong for tech workers and offers a very good long-term residence path, but bureaucracy and appointment delays can slow the process.",
        processing_time: '6-12 weeks',
        typical_cost: 'EUR 110 permit fee plus consular visa fees',
        difficulty: 'moderate',
        key_advantage:
          'Strong labor market and fast path toward permanent residence for Blue Card holders.',
        key_disadvantage:
          'More bureaucracy and more dependence on German-language administration.',
      },
      {
        country_code: 'NL',
        country_name: 'Netherlands',
        summary:
          'The Highly Skilled Migrant permit is usually the fastest and cleanest route for a non-EU engineer when the employer is IND-recognized.',
        processing_time: 'About 2 weeks',
        typical_cost: 'About EUR 192, often handled by the employer',
        difficulty: 'easy',
        key_advantage:
          'Fast processing, English-friendly environment, and the 30 percent ruling can be valuable.',
        key_disadvantage:
          'You need a qualifying salary and an IND-recognized employer.',
      },
      {
        country_code: 'PT',
        country_name: 'Portugal',
        summary:
          'Portugal can be attractive for lifestyle and tax reasons, but residence processing has been slowed by administrative backlog.',
        processing_time: 'Visa stage plus potentially long residence backlog',
        typical_cost: 'Moderate government fees',
        difficulty: 'complex',
        key_advantage:
          'Appealing lifestyle and a potentially favorable tax conversation for some profiles.',
        key_disadvantage:
          'Administrative backlog makes timing less predictable than NL or DE.',
      },
      {
        country_code: 'ES',
        country_name: 'Spain',
        summary:
          'Spain has improved routes for skilled and international workers, and it is often more predictable than Portugal, though still not as frictionless as the Netherlands.',
        processing_time: 'Several weeks to a few months',
        typical_cost: 'Low to moderate government fees',
        difficulty: 'moderate',
        key_advantage:
          'Strong tech hubs and a competitive special-tax option for some workers.',
        key_disadvantage:
          'Regional bureaucracy can vary and Spanish becomes more important over time.',
      },
    ],
    recommendation:
      'For pure speed and simplicity, the Netherlands is the strongest first choice. Germany is the best second choice if you care more about long-term residence trajectory and market depth.',
  },
};

export const CACHED_DOCUMENT_RISK: Record<string, DocumentRisk> = {
  q7_sample: {
    risk_level: 'medium',
    summary:
      'Sample German rental agreement analysis. The biggest concerns are usually cosmetic-repair clauses, unclear service charges, and move-out condition disputes.',
    risks: [
      {
        clause: 'Cosmetic repairs clause',
        risk:
          'German rental templates often overreach by requiring repainting on fixed schedules even when the apartment condition does not justify it.',
        severity: 'medium',
        recommendation:
          'Ask the landlord to clarify or remove the clause, or have a tenant association review it.',
      },
    ],
    missing_clauses: [
      'Clear breakdown of Nebenkosten or service charges',
      'Move-in condition record or handover protocol reference',
      'Confirmation that the landlord will provide the address-registration form',
    ],
    positive_points: [
      'Deposit capped at three months of cold rent',
      'Uses a standard legal framework rather than a fully custom landlord draft',
    ],
    verdict:
      'Check the repairs and service-charge sections carefully before signing, and consider a Mieterverein review.',
  },
  q8_sample: {
    risk_level: 'medium',
    summary:
      'Sample Dutch employment contract analysis. The main issues to review are probation terms, restrictive non-compete language, and whether migration-related support is clearly documented.',
    risks: [
      {
        clause: 'Broad non-compete clause',
        risk:
          'A very broad non-compete can restrict future employment more than necessary, especially if it is not well limited by role, duration, or geography.',
        severity: 'medium',
        recommendation:
          'Ask for narrower scope and written justification, especially for a fixed-term contract.',
      },
    ],
    missing_clauses: [
      'Clear relocation or sponsorship responsibility',
      'Specific probation duration and termination wording',
      'Written vacation, notice, and expense policy references',
    ],
    positive_points: [
      'Dutch contracts often provide a clear salary and holiday allowance structure',
      'If the employer is IND-recognized, the immigration path is usually straightforward',
    ],
    verdict:
      'Review the restrictive clauses and confirm sponsorship details in writing before signing.',
  },
};

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function sameCountries(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].map((item) => item.toUpperCase()).sort();
  const b = [...right].map((item) => item.toUpperCase()).sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function getCachedAnswer(id: string, mode: string): unknown | null {
  if (mode === 'chat') {
    return CACHED_CHAT_ANSWERS[id] || null;
  }
  if (mode === 'journey') {
    return CACHED_JOURNEY_ANSWERS[id] || null;
  }
  if (mode === 'compare') {
    return CACHED_COMPARISON_ANSWERS[id] || null;
  }
  if (mode === 'analyze') {
    return CACHED_DOCUMENT_RISK[`${id}_sample`] || null;
  }
  return null;
}

export function findCachedChatAnswer(
  question: string,
  country: string,
): ProcedureAnswer | null {
  const match = demoQuestions.find(
    (entry) =>
      entry.mode === 'chat' &&
      normalize(entry.prompt.question) === normalize(question) &&
      normalize(entry.prompt.country) === normalize(country),
  );

  return match ? (getCachedAnswer(match.id, match.mode) as ProcedureAnswer | null) : null;
}

export function findCachedJourneyAnswer(
  fromCountry: string,
  toCountry: string,
  nationality?: string,
  purpose?: string,
): RelocationJourney | null {
  const match = demoQuestions.find(
    (entry) =>
      entry.mode === 'journey' &&
      normalize(entry.prompt.from_country) === normalize(fromCountry) &&
      normalize(entry.prompt.to_country) === normalize(toCountry) &&
      normalize(entry.prompt.nationality) === normalize(nationality) &&
      normalize(entry.prompt.purpose) === normalize(purpose),
  );

  return match ? (getCachedAnswer(match.id, match.mode) as RelocationJourney | null) : null;
}

export function findCachedComparisonAnswer(
  question: string,
  countries: string[],
): CountryComparison | null {
  const match = demoQuestions.find(
    (entry) =>
      entry.mode === 'compare' &&
      normalize(entry.prompt.question) === normalize(question) &&
      sameCountries(entry.prompt.countries, countries),
  );

  return match ? (getCachedAnswer(match.id, match.mode) as CountryComparison | null) : null;
}

export function findCachedDocumentRisk(
  documentType: string,
  country: string,
): DocumentRisk | null {
  const match = demoQuestions.find(
    (entry) =>
      entry.mode === 'analyze' &&
      normalize(entry.document_type) === normalize(documentType) &&
      normalize(entry.country) === normalize(country),
  );

  return match ? (getCachedAnswer(match.id, match.mode) as DocumentRisk | null) : null;
}
