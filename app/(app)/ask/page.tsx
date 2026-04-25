"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { AskInput } from "@/components/app/ask-input"
import { AnswerDisplay } from "@/components/app/answer-display"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Lightbulb, X, RotateCcw } from "lucide-react"
import type { BureaucracyResponse } from "@/lib/ai/schemas"

const suggestions = [
  "How do I get a residence permit in Bulgaria?",
  "What documents do I need to register a company?",
  "How to apply for a work visa?",
  "What is the process to renew my passport?",
]

function AskPageInner() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") ?? ""
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<BureaucracyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastQuestion, setLastQuestion] = useState<string>("")
  const [prefill, setPrefill] = useState<string>(initialQ)

  const handleSubmit = async (question: string, file?: File) => {
    setIsLoading(true)
    setError(null)
    setLastQuestion(question)
    setPrefill("")

    const loadingToast = toast.loading("Analyzing your question...", {
      description: "FormWise is structuring the procedure for you.",
    })

    try {
      let documentContext: string | undefined
      if (file) {
        documentContext = `User attached a file: ${file.name} (${file.type})`
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, country: "Bulgaria", documentContext }),
      })

      if (!res.ok) {
        throw new Error("Failed to analyze")
      }

      const data = await res.json()
      setResponse(data.response)
      toast.success("Answer ready", {
        id: loadingToast,
        description: "Step-by-step guidance below.",
      })
    } catch (err) {
      console.error("Analysis error:", err)
      setError("Failed to analyze your question. Please try again.")
      toast.error("Couldn't fetch the answer", {
        id: loadingToast,
        description: "Check your connection and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-submit if a prefill came in via ?q=
  useEffect(() => {
    if (initialQ && !response && !isLoading) {
      handleSubmit(initialQ)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ])

  const handleReset = () => {
    setResponse(null)
    setError(null)
    setLastQuestion("")
    setPrefill("")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Ask FormWise</h1>
        <p className="text-muted-foreground">
          Ask any question about bureaucratic procedures and get step-by-step guidance.
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AskInput
          key={prefill}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialValue={prefill}
        />
      </motion.div>

      {/* Suggestions - only show when no response */}
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

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
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
                  <p className="font-medium">Analyzing your question...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This usually takes a few seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
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
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => lastQuestion && handleSubmit(lastQuestion)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response Display */}
      <AnimatePresence>
        {response && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Results for:{" "}
                <span className="font-medium text-foreground">{lastQuestion}</span>
              </p>
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

export default function AskPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
      <AskPageInner />
    </Suspense>
  )
}
