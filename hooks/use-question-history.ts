"use client"

/**
 * Question History Hook
 * Stores all user questions and AI responses in localStorage
 */

import { useState, useEffect, useCallback } from "react"

// Types for question history
export interface QuestionHistoryItem {
  id: string
  type: "question" | "document"
  title: string
  preview: string
  fullQuestion: string
  response?: Record<string, unknown>  // The full AI response
  country: string
  language: string
  date: string
  timestamp: number  // Unix timestamp for sorting
  status: "completed" | "in-progress"
  documentAnalysis?: boolean
}

export interface QuestionStats {
  totalQuestions: number
  totalDocuments: number
  completedQuestions: number
  countriesUsed: Record<string, number>
}

export interface AddQuestionOptions {
  temporary?: boolean
}

// Storage key
const STORAGE_KEY = "formwise-question-history"
const MAX_ITEMS = 100  // Keep last 100 items

/**
 * Hook to manage question history in localStorage
 */
export function useQuestionHistory() {
  const [history, setHistory] = useState<QuestionHistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Validate and sort by timestamp descending
        const validItems = Array.isArray(parsed) 
          ? parsed.filter(item => item && item.id && item.timestamp)
              .sort((a, b) => b.timestamp - a.timestamp)
          : []
        setHistory(validItems)
      } catch {
        setHistory([])
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever history changes
  const saveToStorage = useCallback((items: QuestionHistoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [])

  // Add a new question to history
  const addQuestion = useCallback((
    question: string,
    response: Record<string, unknown> | null,
    country: string,
    language: string,
    documentAnalysis: boolean = false,
    options: AddQuestionOptions = {}
  ): string => {
    const id = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (options.temporary) {
      return `temp-${id}`
    }
    
    // Create title from question (truncate if too long)
    const title = question.length > 60 
      ? question.slice(0, 57) + "..."
      : question
    
    const newItem: QuestionHistoryItem = {
      id,
      type: documentAnalysis ? "document" : "question",
      title,
      preview: question,
      fullQuestion: question,
      response: response || undefined,
      country,
      language,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      timestamp: Date.now(),
      status: "completed",
      documentAnalysis
    }

    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_ITEMS)
      saveToStorage(updated)
      return updated
    })

    return id
  }, [saveToStorage])

  // Update an existing question
  const updateQuestion = useCallback((id: string, updates: Partial<QuestionHistoryItem>) => {
    setHistory(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  // Delete a question
  const deleteQuestion = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Search history
  const searchHistory = useCallback((query: string): QuestionHistoryItem[] => {
    if (!query.trim()) return history
    const lowerQuery = query.toLowerCase()
    return history.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.preview.toLowerCase().includes(lowerQuery) ||
      item.fullQuestion.toLowerCase().includes(lowerQuery)
    )
  }, [history])

  // Get stats from history
  const getStats = useCallback((): QuestionStats => {
    const stats: QuestionStats = {
      totalQuestions: 0,
      totalDocuments: 0,
      completedQuestions: history.filter(h => h.status === "completed").length,
      countriesUsed: {}
    }

    history.forEach(item => {
      if (item.type === "document") {
        stats.totalDocuments++
      } else {
        stats.totalQuestions++
      }
      
      if (item.country) {
        stats.countriesUsed[item.country] = (stats.countriesUsed[item.country] || 0) + 1
      }
    })

    return stats
  }, [history])

  // Get recent items
  const getRecentItems = useCallback((limit: number = 5): QuestionHistoryItem[] => {
    return history.slice(0, limit)
  }, [history])

  const getQuestionById = useCallback((id: string): QuestionHistoryItem | undefined => {
    return history.find(item => item.id === id)
  }, [history])

  return {
    history,
    isLoaded,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    clearHistory,
    searchHistory,
    getStats,
    getRecentItems,
    getQuestionById
  }
}

/**
 * Question Validation
 * Check if a question is complete enough to answer
 */
export interface ValidationResult {
  isValid: boolean
  missingInfo: string[]
  suggestions: string[]
}

const MIN_QUESTION_LENGTH = 10
const COMMON_PROCEDURE_KEYWORDS = [
  "visa", "permit", "license", "registration", "certificate", 
  "passport", "citizenship", "residency", "work", "tax",
  "driver", "health", "insurance", "benefits", "application"
]

const COUNTRY_CONTEXT_KEYWORDS = [
  "in", "for", "to", "from", "at", "with"
]

export function validateQuestion(question: string, country: string): ValidationResult {
  const missingInfo: string[] = []
  const suggestions: string[] = []

  // Check minimum length
  if (question.length < MIN_QUESTION_LENGTH) {
    missingInfo.push("Question is too short. Please provide more details.")
    suggestions.push("Add more context about your situation")
  }

  // Check for procedure type keywords
  const hasProcedureKeyword = COMMON_PROCEDURE_KEYWORDS.some(
    keyword => question.toLowerCase().includes(keyword)
  )
  
  if (!hasProcedureKeyword) {
    suggestions.push("Include the type of procedure (e.g., visa, permit, certificate)")
  }

  // Check for country context
  const words = question.toLowerCase().split(/\s+/)
  const hasCountryMention = COUNTRY_CONTEXT_KEYWORDS.some(
    keyword => words.includes(keyword)
  )
  
  // If country is not set or question doesn't mention location context
  if (!country || country === "") {
    missingInfo.push("No country selected. Please select a country.")
    suggestions.push("Select the country where you need this procedure")
  }

  // Check for vague words
  const vagueWords = ["something", "stuff", "things", "help", "info", "information"]
  const hasVagueWords = vagueWords.some(word => 
    question.toLowerCase().includes(word)
  )
  
  if (hasVagueWords) {
    missingInfo.push("Question contains vague terms. Please be more specific.")
    suggestions.push("Replace vague words with specific details")
  }

  // Check for question mark
  if (!question.includes("?")) {
    missingInfo.push("Please end your question with a question mark (?).")
  }

  // Check if it's a statement instead of a question
  const questionStarters = ["how", "what", "where", "when", "why", "can", "do", "does", "is", "are", "should", "could", "would"]
  const startsWithQuestion = questionStarters.some(
    starter => question.toLowerCase().trim().startsWith(starter)
  )
  
  if (!startsWithQuestion && !question.includes("?")) {
    missingInfo.push("Please phrase your question clearly.")
    suggestions.push("Start with 'How', 'What', 'Where', 'When', or 'Can'")
  }

  return {
    isValid: missingInfo.length === 0 && question.length >= MIN_QUESTION_LENGTH,
    missingInfo,
    suggestions
  }
}
