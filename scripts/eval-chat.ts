import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './load-env';
import type { ProcedureAnswer } from '../lib/types';

loadLocalEnv();

interface EvalCase {
  id: string;
  question: string;
  country: string;
  language: string;
  expects_more_context: boolean;
  must_include_any: string[];
  min_non_empty_sections: number;
}

function readCases(): EvalCase[] {
  const filePath = path.join(process.cwd(), 'tests', 'evals', 'chat-cases.json');
  return JSON.parse(readFileSync(filePath, 'utf8')) as EvalCase[];
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function countNonEmptySections(answer: ProcedureAnswer): number {
  const sections = [
    answer.steps,
    answer.documents,
    answer.key_points,
    answer.checklist,
    answer.legal_basis,
    answer.covers,
    answer.not_covered,
    answer.eligibility,
    answer.prerequisites,
    answer.exceptions,
    answer.timeline_details,
    answer.cost_breakdown,
    answer.risks,
    answer.positive_points,
    answer.missing_clauses,
    answer.common_mistakes,
    answer.scams_to_avoid,
    answer.what_not_to_do,
    answer.follow_up_questions,
    answer.related_procedures,
  ];

  return sections.filter((items) => Array.isArray(items) && items.length > 0).length;
}

function flattenAnswerText(answer: ProcedureAnswer): string {
  return [
    answer.summary,
    answer.office || '',
    answer.fee_info || '',
    answer.source_url || '',
    ...answer.steps,
    ...answer.documents,
    ...answer.key_points,
    ...answer.checklist,
    ...answer.legal_basis,
    ...answer.covers,
    ...answer.not_covered,
    ...answer.eligibility,
    ...answer.prerequisites,
    ...answer.exceptions,
    ...(answer.estimated_timeline ? [answer.estimated_timeline] : []),
    ...answer.timeline_details,
    ...answer.cost_breakdown,
    ...answer.risks,
    ...answer.positive_points,
    ...answer.missing_clauses,
    ...answer.common_mistakes,
    ...answer.scams_to_avoid,
    ...answer.what_not_to_do,
    ...answer.missing_context,
    ...answer.follow_up_questions,
    ...answer.related_procedures,
  ]
    .join('\n')
    .toLowerCase();
}

async function runCase(testCase: EvalCase) {
  const startedAt = Date.now();
  const { POST: chatRoute } = await import('../app/api/chat/route');
  const req = new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: testCase.question,
      country: testCase.country,
      language: testCase.language,
      stream: false,
    }),
  });

  const res = await chatRoute(req);
  if (!res.ok) {
    throw new Error(`${testCase.id} failed with ${res.status}: ${await res.text()}`);
  }

  const answer = (await res.json()) as ProcedureAnswer;
  const durationMs = Date.now() - startedAt;
  const richSectionCount = countNonEmptySections(answer);
  const flattened = flattenAnswerText(answer);
  const matchedExpectation = testCase.must_include_any.some((term) =>
    flattened.includes(normalize(term)),
  );
  const officialSources = (answer.used_sources || []).filter((item) => item.is_official).length;

  const checks = [
    {
      label: 'context-flag',
      pass: answer.needs_more_context === testCase.expects_more_context,
      detail: `expected ${testCase.expects_more_context}, got ${answer.needs_more_context}`,
    },
    {
      label: 'rich-sections',
      pass: richSectionCount >= testCase.min_non_empty_sections,
      detail: `expected >= ${testCase.min_non_empty_sections}, got ${richSectionCount}`,
    },
    {
      label: 'content-signal',
      pass: matchedExpectation,
      detail: `expected one of: ${testCase.must_include_any.join(', ')}`,
    },
    {
      label: 'official-source',
      pass: officialSources > 0 || answer.needs_more_context === true,
      detail: `official sources found: ${officialSources}`,
    },
  ];

  return {
    id: testCase.id,
    answer,
    checks,
    durationMs,
    richSectionCount,
    officialSources,
  };
}

async function main() {
  const cases = readCases();
  const results = [];

  for (const testCase of cases) {
    process.stdout.write(`\nRunning ${testCase.id}...\n`);
    const result = await runCase(testCase);
    results.push(result);

    for (const check of result.checks) {
      process.stdout.write(
        `  ${check.pass ? 'PASS' : 'FAIL'} ${check.label}: ${check.detail}\n`,
      );
    }

    process.stdout.write(
      `  INFO latency=${result.durationMs}ms sections=${result.richSectionCount} official_sources=${result.officialSources}\n`,
    );

    if (result.checks.some((check) => !check.pass)) {
      process.stdout.write(`  SUMMARY ${result.answer.summary.slice(0, 240)}\n`);
      process.stdout.write(
        `  FLAGS answerable=${result.answer.answerable} needs_more_context=${result.answer.needs_more_context} confidence=${result.answer.confidence}\n`,
      );
      if (result.answer.follow_up_questions.length > 0) {
        process.stdout.write(
          `  FOLLOW_UP ${result.answer.follow_up_questions.slice(0, 3).join(' | ')}\n`,
        );
      }
    }
  }

  const totalChecks = results.flatMap((result) => result.checks);
  const passedChecks = totalChecks.filter((check) => check.pass).length;

  process.stdout.write(
    `\nEval summary: ${passedChecks}/${totalChecks.length} checks passed across ${results.length} cases.\n`,
  );

  if (passedChecks !== totalChecks.length) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
