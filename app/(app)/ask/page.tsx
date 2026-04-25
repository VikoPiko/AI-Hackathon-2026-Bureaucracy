"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AskInput } from "@/components/app/ask-input"
import { AnswerDisplay } from "@/components/app/answer-display"
import { DocumentAnalysisDisplay } from "@/components/app/document-analysis-display"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Lightbulb, RotateCcw, Sparkles, X } from "lucide-react"
import {
  analyzeDocument,
  askQuestionStream,
  shouldUseDocumentAnalysis,
} from "@/lib/ai/client"
import type { BureaucracyResponse } from "@/lib/ai/schemas"
import type { DocumentRisk } from "@/lib/types"

const suggestions = [
  "How do I get a residence permit in Germany?",
  "Review this employment contract for risks before I sign it.",
  "What documents do I need to register a company?",
  "What does this official letter require me to do next?",
]

type AskResult =
  | { kind: "procedure"; data: BureaucracyResponse }
  | { kind: "document"; data: DocumentRisk }
  | null

function shouldPauseForProcedureClarification(response: BureaucracyResponse): boolean {
  return Boolean(
    response.needsMoreContext &&
    (
      response.answerable === false ||
      (typeof response.confidence === "number" && response.confidence < 0.55) ||
      (
        response.steps.length === 0 &&
        response.requiredDocuments.length === 0 &&
        response.keyPoints?.length === 0 &&
        response.checklist?.length === 0
      )
    ),
  )
}

export default function AskPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AskResult>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastQuestion, setLastQuestion] = useState<string>("")
  const [lastFile, setLastFile] = useState<File | undefined>(undefined)
  const [liveStatus, setLiveStatus] = useState<string>("")
  const [followUpContext, setFollowUpContext] = useState("")

  const submitQuestion = async (requestQuestion: string, displayQuestion: string, file?: File) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setLastQuestion(displayQuestion)
    setLastFile(file)
    setFollowUpContext("")

    try {
      if (file && shouldUseDocumentAnalysis(requestQuestion, file)) {
        setLiveStatus("Reviewing your document for risks and missing clauses...")
        const data = await analyzeDocument({
          question: requestQuestion,
          file,
        })
        setResult({ kind: "document", data })
        setLiveStatus("Done")
      } else {
        setLiveStatus(file ? "Reading your attached document..." : "Searching the knowledge base...")
        const data = await askQuestionStream({
          question: requestQuestion,
          file,
          onStatus: setLiveStatus,
          onPartial: (partial) => setResult({ kind: "procedure", data: partial }),
        })
        setResult({ kind: "procedure", data })
        setLiveStatus("Done")
      }
    } catch (err) {
      console.error("Analysis error:", err)
      setResult(null)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze your request. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (question: string, file?: File) => {
    await submitQuestion(question, question, file)
  }

  const handleContinueWithContext = async () => {
    if (!followUpContext.trim() || !lastQuestion.trim()) {
      return
    }

    const enrichedQuestion = `${lastQuestion}

Additional context from the user:
${followUpContext.trim()}

Please update the answer using this added context, keep the same response language as the user's original request, and keep the same structured output format.`

    await submitQuestion(enrichedQuestion, lastQuestion, lastFile)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setLastQuestion("")
    setLastFile(undefined)
    setLiveStatus("")
  }

  const shouldPauseForClarification =
    result?.kind === "procedure"
      ? shouldPauseForProcedureClarification(result.data)
      : false

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Ask FormWise</h1>
        <p className="text-muted-foreground">
          Ask about a procedure, or attach a document for either guided next steps or a structured risk review.
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
        {!result && !isLoading && !error && (
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
        {isLoading && !result && (
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
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => lastQuestion && handleSubmit(lastQuestion, lastFile)}
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

      <AnimatePresence>
        {result && (
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

            {result.kind === "procedure" ? (
              <>
                {result.data.needsMoreContext && (
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {shouldPauseForClarification
                            ? "I need a bit more detail before I finish the answer"
                            : "Add the missing context and continue"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {shouldPauseForClarification
                            ? "Reply to the questions below and we&apos;ll resend your original request with your extra details before producing the full guidance."
                            : "We&apos;ll resend your original request together with your extra details and update the answer in place."}
                        </p>
                      </div>
                      {shouldPauseForClarification && (
                        <p className="text-sm text-muted-foreground">
                          {result.data.summary}
                        </p>
                      )}
                      <Textarea
                        value={followUpContext}
                        onChange={(event) => setFollowUpContext(event.target.value)}
                        placeholder={result.data.followUpQuestions && result.data.followUpQuestions.length > 0
                          ? result.data.followUpQuestions.join("\n")
                          : "Add the extra details the answer is asking for..."}
                        className="min-h-28"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleContinueWithContext}
                          disabled={isLoading || !followUpContext.trim()}
                          className="gap-2"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Continue With More Context
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!shouldPauseForClarification && (
                  <AnswerDisplay question={lastQuestion} response={result.data} />
                )}
              </>
            ) : (
              <>
                {result.data.needs_more_context && (
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <p className="font-medium">Add the missing context and continue</p>
                        <p className="text-sm text-muted-foreground">
                          We&apos;ll reuse the same document and resend your extra details for a fuller review.
                        </p>
                      </div>
                      <Textarea
                        value={followUpContext}
                        onChange={(event) => setFollowUpContext(event.target.value)}
                        placeholder={result.data.follow_up_questions && result.data.follow_up_questions.length > 0
                          ? result.data.follow_up_questions.join("\n")
                          : "Add the missing details, missing pages, or answers here..."}
                        className="min-h-28"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleContinueWithContext}
                          disabled={isLoading || !followUpContext.trim()}
                          className="gap-2"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Continue With More Context
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <DocumentAnalysisDisplay question={lastQuestion} response={result.data} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
