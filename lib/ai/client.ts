import type { BureaucracyResponse } from "@/lib/ai/schemas"
import { saveHistoryEntry } from "@/lib/history/storage"
import type { ProcedureAnswer } from "@/lib/types"

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

type PartialProcedureAnswer = Partial<ProcedureAnswer> & {
  steps?: string[]
  documents?: string[]
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
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
    officeInfo: {
      name: officeName,
      website: hasText(answer.source_url) ? answer.source_url : undefined,
      appointmentRequired: undefined,
      address: undefined,
      phone: undefined,
      hours: undefined,
    },
    costs: hasText(answer.fee_info) ? answer.fee_info : undefined,
    additionalNotes:
      answer.answerable === false
        ? "This answer has low confidence. Double-check the official source before acting."
        : undefined,
    relatedProcedures: undefined,
  }
}

function buildRequestBody(options: AskQuestionOptions, resolvedCountry: string): BodyInit {
  if (!options.file) {
    return JSON.stringify({
      question: options.question,
      country: resolvedCountry,
      language: options.language || "en",
      stream: options.stream ?? false,
    })
  }

  const formData = new FormData()
  formData.set("question", options.question)
  formData.set("country", resolvedCountry)
  formData.set("language", options.language || "en")
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
  language = "en",
  stream = false,
  file,
}: AskQuestionOptions): Promise<BureaucracyResponse> {
  const resolvedCountry = country || inferCountry(question)
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: buildRequestHeaders({ question, country: resolvedCountry, language, stream, file }),
    body: buildRequestBody({ question, country: resolvedCountry, language, stream, file }, resolvedCountry),
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
  language = "en",
  file,
  onStatus,
  onPartial,
}: AskQuestionStreamOptions): Promise<BureaucracyResponse> {
  const resolvedCountry = country || inferCountry(question)
  const res = await fetch("/api/chat", {
    method: "POST",
    body: buildRequestBody(
      { question, country: resolvedCountry, language, stream: true, file },
      resolvedCountry,
    ),
    headers: buildRequestHeaders({
      question,
      country: resolvedCountry,
      language,
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
