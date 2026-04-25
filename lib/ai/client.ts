import type { BureaucracyResponse } from "@/lib/ai/schemas"
import { inferLanguageFromText } from "@/lib/ai/request-utils"
import {
  saveDocumentHistoryEntry,
  saveHistoryEntry,
} from "@/lib/history/storage"
import type { DocumentRisk, ProcedureAnswer } from "@/lib/types"

interface AskQuestionOptions {
  question: string
  country?: string
  language?: string
  stream?: boolean
  file?: File
}

interface AskQuestionStreamOptions extends AskQuestionOptions {
  onStatus?: (message: string) => void
  onPartial?: (response: BureaucracyResponse) => void
}

interface AnalyzeDocumentOptions {
  question: string
  file: File
  country?: string
  documentType?: string
}

type PartialProcedureAnswer = Partial<ProcedureAnswer> & {
  steps?: string[]
  documents?: string[]
  key_points?: string[]
  checklist?: string[]
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function inferLanguage(question: string): string {
  return inferLanguageFromText(question)
}

export function inferCountry(question: string): string {
  const normalized = question.toLowerCase()

  if (normalized.includes("bulgaria")) return "BG"
  if (normalized.includes("germany") || normalized.includes("german")) return "DE"
  if (normalized.includes("netherlands") || normalized.includes("dutch")) return "NL"
  if (normalized.includes("portugal") || normalized.includes("portuguese")) return "PT"
  if (normalized.includes("spain") || normalized.includes("spanish")) return "ES"
  if (normalized.includes("france") || normalized.includes("french")) return "FR"
  if (normalized.includes("poland") || normalized.includes("polish")) return "PL"
  if (normalized.includes("georgia")) return "GE"
  if (normalized.includes("austria") || normalized.includes("austrian")) return "AT"
  if (normalized.includes("sweden") || normalized.includes("swedish")) return "SE"
  if (normalized.includes("united kingdom") || normalized.includes("uk ")) return "GB"

  return "DE"
}

export function shouldUseDocumentAnalysis(question: string, file?: File): boolean {
  if (!file) {
    return false
  }

  const normalized = question.toLowerCase()
  const keywords = [
    "analyze",
    "analysis",
    "review",
    "letter",
    "notice",
    "deadline",
    "appeal",
    "what does this mean",
    "what do i need to do",
    "risk",
    "risky",
    "safe to sign",
    "sign this",
    "clause",
    "contract",
    "agreement",
    "lease",
    "employment contract",
    "rental contract",
    "missing clause",
    "verdict",
  ]

  return keywords.some((keyword) => normalized.includes(keyword))
}

function inferDocumentType(question: string, file: File): string {
  const normalized = `${question} ${file.name}`.toLowerCase()

  if (normalized.includes("rental") || normalized.includes("lease")) return "rental"
  if (normalized.includes("employment") || normalized.includes("job")) return "employment"
  if (normalized.includes("letter") || normalized.includes("notice")) return "official_letter"
  return "contract"
}

function estimateDifficulty(answer: PartialProcedureAnswer): BureaucracyResponse["difficulty"] {
  const stepCount = answer.steps?.length ?? 0
  const confidence = answer.confidence ?? 0.7

  if (stepCount >= 7 || confidence < 0.55) {
    return "complex"
  }

  if (stepCount >= 4 || confidence < 0.8) {
    return "moderate"
  }

  return "easy"
}

function estimateTotalTime(answer: PartialProcedureAnswer): string {
  if (hasText(answer.estimated_timeline)) {
    return answer.estimated_timeline
  }

  const stepCount = answer.steps?.length ?? 0

  if (stepCount >= 7) return "Several weeks to several months"
  if (stepCount >= 4) return "Several days to several weeks"
  return "A few days to a few weeks"
}

function toTitle(question: string, answer: PartialProcedureAnswer): string {
  if (hasText(answer.office)) {
    return answer.office.split(" - ")[0]
  }

  return question.trim().slice(0, 80)
}

export function mapProcedureAnswerToUi(
  question: string,
  answer: PartialProcedureAnswer,
): BureaucracyResponse {
  const officeName = hasText(answer.office)
    ? answer.office
    : "Relevant government office"

  return {
    summary: answer.summary || "Working on your answer...",
    procedureName: toTitle(question, answer),
    difficulty: estimateDifficulty(answer),
    totalEstimatedTime: estimateTotalTime(answer),
    steps: (answer.steps || []).map((step, index) => ({
      number: index + 1,
      title: `Step ${index + 1}`,
      description: step,
      estimatedTime: undefined,
      tips: undefined,
    })),
    requiredDocuments: (answer.documents || []).map((document) => ({
      name: document,
      description: document,
      required: true,
      whereToGet: undefined,
    })),
    keyPoints: answer.key_points || [],
    checklist: answer.checklist || [],
    legalBasis: answer.legal_basis || [],
    covers: answer.covers || [],
    notCovered: answer.not_covered || [],
    eligibility: answer.eligibility || [],
    prerequisites: answer.prerequisites || [],
    exceptions: answer.exceptions || [],
    timelineDetails: answer.timeline_details || [],
    costBreakdown: answer.cost_breakdown || [],
    risks: answer.risks || [],
    positivePoints: answer.positive_points || [],
    missingClauses: answer.missing_clauses || [],
    commonMistakes: answer.common_mistakes || [],
    scamsToAvoid: answer.scams_to_avoid || [],
    whatNotToDo: answer.what_not_to_do || [],
    officeInfo: {
      name: officeName,
      website: hasText(answer.source_url) ? answer.source_url : undefined,
      appointmentRequired: undefined,
      address: undefined,
      phone: undefined,
      hours: undefined,
    },
    costs: hasText(answer.fee_info)
      ? answer.fee_info
      : answer.cost_breakdown?.find((item) => hasText(item)),
    additionalNotes:
      answer.answerable === false
        ? "This answer still needs more context before you should rely on it."
        : undefined,
    confidence: answer.confidence,
    answerable: answer.answerable,
    needsMoreContext: answer.needs_more_context,
    missingContext: answer.missing_context || [],
    followUpQuestions: answer.follow_up_questions || [],
    sources: (answer.used_sources || []).map((source) => ({
      title: source.title,
      url: source.url,
      kind: source.kind,
      isOfficial: source.is_official,
    })),
    relatedProcedures: answer.related_procedures || [],
  }
}

function buildRequestBody(options: AskQuestionOptions, resolvedCountry: string): BodyInit {
  const resolvedLanguage = options.language ?? inferLanguage(options.question)

  if (!options.file) {
    return JSON.stringify({
      question: options.question,
      country: resolvedCountry,
      language: resolvedLanguage,
      stream: options.stream ?? false,
    })
  }

  const formData = new FormData()
  formData.set("question", options.question)
  formData.set("country", resolvedCountry)
  formData.set("language", resolvedLanguage)
  formData.set("stream", String(options.stream ?? false))
  formData.set("file", options.file)
  return formData
}

function buildRequestHeaders(options: AskQuestionOptions): HeadersInit | undefined {
  if (options.file) {
    return undefined
  }

  return { "Content-Type": "application/json" }
}

async function saveSuccessfulHistory(
  question: string,
  country: string,
  answer: ProcedureAnswer,
  file?: File,
): Promise<void> {
  saveHistoryEntry({
    question,
    country,
    answer,
    fileName: file?.name,
  })
}

export async function askQuestion({
  question,
  country,
  language,
  stream = false,
  file,
}: AskQuestionOptions): Promise<BureaucracyResponse> {
  const resolvedCountry = country || inferCountry(question)
  const resolvedLanguage = language ?? inferLanguage(question)
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: buildRequestHeaders({
      question,
      country: resolvedCountry,
      language: resolvedLanguage,
      stream,
      file,
    }),
    body: buildRequestBody(
      { question, country: resolvedCountry, language: resolvedLanguage, stream, file },
      resolvedCountry,
    ),
  })

  if (!res.ok) {
    throw new Error("Failed to fetch guidance")
  }

  const answer = (await res.json()) as ProcedureAnswer
  await saveSuccessfulHistory(question, resolvedCountry, answer, file)
  return mapProcedureAnswerToUi(question, answer)
}

export async function askQuestionStream({
  question,
  country,
  language,
  file,
  onStatus,
  onPartial,
}: AskQuestionStreamOptions): Promise<BureaucracyResponse> {
  const resolvedCountry = country || inferCountry(question)
  const resolvedLanguage = language ?? inferLanguage(question)
  const res = await fetch("/api/chat", {
    method: "POST",
    body: buildRequestBody(
      { question, country: resolvedCountry, language: resolvedLanguage, stream: true, file },
      resolvedCountry,
    ),
    headers: buildRequestHeaders({
      question,
      country: resolvedCountry,
      language: resolvedLanguage,
      stream: true,
      file,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error("Failed to start streamed guidance")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let currentEvent = "message"
  let finalAnswer: ProcedureAnswer | null = null

  const handleEvent = async (event: string, payload: string) => {
    if (!payload) {
      return
    }

    const data = JSON.parse(payload) as
      | { message?: string }
      | PartialProcedureAnswer
      | ProcedureAnswer

    if (event === "status") {
      onStatus?.((data as { message?: string }).message || "Working...")
      return
    }

    if (event === "partial") {
      onPartial?.(mapProcedureAnswerToUi(question, data as PartialProcedureAnswer))
      return
    }

    if (event === "final") {
      finalAnswer = data as ProcedureAnswer
      await saveSuccessfulHistory(question, resolvedCountry, finalAnswer, file)
      return
    }

    if (event === "error") {
      throw new Error((data as { message?: string }).message || "Streaming failed")
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const messages = buffer.split("\n\n")
    buffer = messages.pop() || ""

    for (const message of messages) {
      const lines = message.split("\n")
      let event = currentEvent
      const dataLines: string[] = []

      for (const line of lines) {
        if (line.startsWith("event:")) {
          event = line.slice(6).trim()
          currentEvent = event
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim())
        }
      }

      await handleEvent(event, dataLines.join("\n"))
    }
  }

  if (!finalAnswer) {
    throw new Error("The streamed response did not complete.")
  }

  return mapProcedureAnswerToUi(question, finalAnswer)
}

export async function analyzeDocument({
  question,
  file,
  country,
  documentType,
}: AnalyzeDocumentOptions): Promise<DocumentRisk> {
  const resolvedCountry = country || inferCountry(question)
  const resolvedType = documentType || inferDocumentType(question, file)
  const resolvedLanguage = inferLanguage(question)
  const formData = new FormData()
  formData.set("question", question)
  formData.set("country", resolvedCountry)
  formData.set("language", resolvedLanguage)
  formData.set("document_type", resolvedType)
  formData.set("file", file)

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    throw new Error("Failed to analyze document")
  }

  const answer = (await res.json()) as DocumentRisk
  saveDocumentHistoryEntry({
    question,
    country: resolvedCountry,
    answer,
    fileName: file.name,
  })

  return answer
}
