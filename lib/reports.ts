"use client"

import type { BureaucracyResponse } from "@/lib/ai/schemas"
import type { DocumentRisk } from "@/lib/types"

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadProcedureChecklist(
  question: string,
  response: BureaucracyResponse,
): void {
  const checklist = [
    `Procedure checklist for: ${question}`,
    "",
    "Key points:",
    ...(response.keyPoints || []).map((item) => `- ${item}`),
    "",
    "Checklist:",
    ...((response.checklist && response.checklist.length > 0
      ? response.checklist
      : [
          ...response.requiredDocuments.map((item) => `Gather ${item.name}`),
          ...response.steps.map((item) => item.description),
        ]).map((item) => `- [ ] ${item}`)),
    "",
    "Official source:",
    response.officeInfo.website || "Not provided",
    "",
    "Used sources:",
    ...((response.sources || []).map((item) => `- ${item.title}${item.url ? ` (${item.url})` : ""}`)),
  ].join("\n")

  downloadText("formwise-checklist.txt", checklist)
}

export function downloadProcedureReport(
  question: string,
  response: BureaucracyResponse,
): void {
  const report = [
    `FormWise report: ${question}`,
    "",
    `Summary: ${response.summary}`,
    `Difficulty: ${response.difficulty}`,
    `Estimated time: ${response.totalEstimatedTime}`,
    `Office: ${response.officeInfo.name}`,
    `Costs: ${response.costs || "Not provided"}`,
    "",
    "Key points:",
    ...((response.keyPoints || []).map((item) => `- ${item}`)),
    "",
    "Steps:",
    ...response.steps.map((step) => `${step.number}. ${step.description}`),
    "",
    "Required documents:",
    ...response.requiredDocuments.map((item) => `- ${item.name}`),
    "",
    "Missing context:",
    ...((response.missingContext || []).map((item) => `- ${item}`)),
    "",
    "Follow-up questions:",
    ...((response.followUpQuestions || []).map((item) => `- ${item}`)),
    "",
    `Official source: ${response.officeInfo.website || "Not provided"}`,
    "",
    "Used sources:",
    ...((response.sources || []).map((item) => `- ${item.title}${item.url ? ` (${item.url})` : ""}`)),
  ].join("\n")

  downloadText("formwise-report.txt", report)
}

export function downloadDocumentChecklist(
  question: string,
  response: DocumentRisk,
): void {
  const checklist = [
    `Document checklist for: ${question}`,
    "",
    "Key points:",
    ...response.key_points.map((item) => `- ${item}`),
    "",
    "Checklist:",
    ...response.checklist.map((item) => `- [ ] ${item}`),
    "",
    "Missing context:",
    ...response.missing_context.map((item) => `- ${item}`),
    "",
    "Follow-up questions:",
    ...response.follow_up_questions.map((item) => `- ${item}`),
    "",
    "Used sources:",
    ...((response.used_sources || []).map((item) => `- ${item.title}${item.url ? ` (${item.url})` : ""}`)),
  ].join("\n")

  downloadText("formwise-document-checklist.txt", checklist)
}

export function downloadDocumentReport(
  question: string,
  response: DocumentRisk,
): void {
  const report = [
    `FormWise document report: ${question}`,
    "",
    `Summary: ${response.summary}`,
    `Risk level: ${response.risk_level}`,
    `Difficulty: ${response.difficulty}`,
    `Confidence: ${response.confidence}`,
    `Verdict: ${response.verdict}`,
    "",
    "Key points:",
    ...response.key_points.map((item) => `- ${item}`),
    "",
    "Risks:",
    ...response.risks.map(
      (item) =>
        `- [${item.severity.toUpperCase()}] ${item.clause}: ${item.risk} Recommendation: ${item.recommendation}`,
    ),
    "",
    "Missing clauses:",
    ...response.missing_clauses.map((item) => `- ${item}`),
    "",
    "Positive points:",
    ...response.positive_points.map((item) => `- ${item}`),
    "",
    "Used sources:",
    ...((response.used_sources || []).map((item) => `- ${item.title}${item.url ? ` (${item.url})` : ""}`)),
  ].join("\n")

  downloadText("formwise-document-report.txt", report)
}
