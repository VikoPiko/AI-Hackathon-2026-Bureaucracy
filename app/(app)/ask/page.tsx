"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AskInput } from "@/components/app/ask-input"
import { AnswerDisplay } from "@/components/app/answer-display"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Lightbulb, X, RotateCcw, Sparkles } from "lucide-react"
import { askQuestionStream } from "@/lib/ai/client"
import type { BureaucracyResponse } from "@/lib/ai/schemas"

const suggestions = [
  "How do I get a residence permit in Germany?",
  "What documents do I need to register a company?",
  "How to apply for a work visa?",
  "What is the process to renew my passport?",
]

export default function AskPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<BureaucracyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastQuestion, setLastQuestion] = useState<string>("")
  const [lastFile, setLastFile] = useState<File | undefined>(undefined)
  const [liveStatus, setLiveStatus] = useState<string>("")

  const handleSubmit = async (question: string, file?: File) => {
    setIsLoading(true)
    setError(null)
    setResponse(null)
    setLastQuestion(question)
    setLastFile(file)
    setLiveStatus(file ? "Reading your attached document..." : "Searching the knowledge base...")

    try {
      const data = await askQuestionStream({
        question,
        file,
        onStatus: setLiveStatus,
        onPartial: setResponse,
      })
      setResponse(data)
      setLiveStatus("Done")
    } catch (err) {
      console.error("Analysis error:", err)
      setResponse(null)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze your question. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResponse(null)
    setError(null)
    setLastQuestion("")
    setLastFile(undefined)
    setLiveStatus("")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Ask FormWise</h1>
        <p className="text-muted-foreground">
          Ask about a bureaucracy process, or attach a document and have the answer grounded in official guidance.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AskInput onSubmit={handleSubmit} isLoading={isLoading} />
      </motion.div>

      <AnimatePresence>
        {!response && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              <span>Try asking about:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(suggestion)}
                  className="text-sm"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && !response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-12">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Analyzing your request...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {liveStatus || "This usually takes a few seconds"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-destructive/50 bg-destructive/5">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
                <X className="h-10 w-10 text-destructive" />
                <div className="text-center">
                  <p className="font-medium text-destructive">{error}</p>
                  {!lastFile && (
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => lastQuestion && handleSubmit(lastQuestion)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Results for: <span className="font-medium text-foreground">{lastQuestion}</span>
                </p>
                {isLoading && (
                  <p className="text-sm text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {liveStatus || "Streaming answer..."}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                New Question
              </Button>
            </div>
            <AnswerDisplay response={response} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
