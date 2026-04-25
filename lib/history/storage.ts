"use client"

import type { ProcedureAnswer } from "@/lib/types"

export interface HistoryEntry {
  id: string
  type: "question" | "document"
  question: string
  title: string
  preview: string
  country: string
  createdAt: string
  status: "completed" | "error"
  fileName?: string
  response?: ProcedureAnswer
}

const STORAGE_KEY = "formwise-history-v1"
const MAX_HISTORY_ITEMS = 50

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function createTitle(question: string, answer: ProcedureAnswer): string {
  if (answer.office) {
    return answer.office.split(" - ")[0]
  }

  return question.trim().slice(0, 80)
}

function createPreview(question: string, answer: ProcedureAnswer): string {
  return answer.summary || question.trim().slice(0, 160)
}

export function readHistory(): HistoryEntry[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function saveHistoryEntry(options: {
  question: string
  country: string
  answer: ProcedureAnswer
  fileName?: string
}): HistoryEntry {
  const entry: HistoryEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: options.fileName ? "document" : "question",
    question: options.question,
    title: createTitle(options.question, options.answer),
    preview: createPreview(options.question, options.answer),
    country: options.country,
    createdAt: new Date().toISOString(),
    status: "completed",
    fileName: options.fileName,
    response: options.answer,
  }

  const existing = readHistory()
  writeHistory([entry, ...existing].slice(0, MAX_HISTORY_ITEMS))
  return entry
}
