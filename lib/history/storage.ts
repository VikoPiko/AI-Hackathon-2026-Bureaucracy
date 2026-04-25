"use client"

import type { DocumentRisk, ProcedureAnswer } from "@/lib/types"

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
  response?: unknown
}

const STORAGE_KEY = "formwise-history-v1"
const MAX_HISTORY_ITEMS = 50

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function writeHistory(entries: HistoryEntry[]): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function createBaseEntry(options: {
  question: string
  country: string
  type: "question" | "document"
  title: string
  preview: string
  fileName?: string
  response?: unknown
}): HistoryEntry {
  return {
    id: createId(),
    type: options.type,
    question: options.question,
    title: options.title,
    preview: options.preview,
    country: options.country,
    createdAt: new Date().toISOString(),
    status: "completed",
    fileName: options.fileName,
    response: options.response,
  }
}

function prependHistory(entry: HistoryEntry): HistoryEntry {
  const existing = readHistory()
  writeHistory([entry, ...existing].slice(0, MAX_HISTORY_ITEMS))
  return entry
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

export function saveHistoryEntry(options: {
  question: string
  country: string
  answer: ProcedureAnswer
  fileName?: string
}): HistoryEntry {
  const entry = createBaseEntry({
    question: options.question,
    country: options.country,
    type: options.fileName ? "document" : "question",
    title: options.answer.office
      ? options.answer.office.split(" - ")[0]
      : options.question.trim().slice(0, 80),
    preview: options.answer.summary || options.question.trim().slice(0, 160),
    fileName: options.fileName,
    response: options.answer,
  })

  return prependHistory(entry)
}

export function saveDocumentHistoryEntry(options: {
  question: string
  country: string
  answer: DocumentRisk
  fileName?: string
}): HistoryEntry {
  const entry = createBaseEntry({
    question: options.question,
    country: options.country,
    type: "document",
    title: options.fileName
      ? `Document review: ${options.fileName}`
      : "Document review",
    preview: options.answer.verdict || options.answer.summary,
    fileName: options.fileName,
    response: options.answer,
  })

  return prependHistory(entry)
}
