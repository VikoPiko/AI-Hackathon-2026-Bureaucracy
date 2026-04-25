"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

const sampleQuestions = [
  "How do I apply for a residence permit in Bulgaria?",
  "What documents do I need for a work visa?",
  "How to register a company abroad?",
]

interface DemoPreviewProps {
  onSubmit: (question: string) => void
  isLoading?: boolean
}

export function DemoPreview({ onSubmit, isLoading }: DemoPreviewProps) {
  const [question, setQuestion] = useState("")
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim() && !isLoading) {
      onSubmit(question.trim())
    }
  }

  const handleSampleClick = (sample: string) => {
    setQuestion(sample)
  }

  return (
    <section id="demo" className="py-24 sm:py-32 bg-secondary/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Try it now
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ask any question about bureaucratic procedures and see how FormWise can help.
            </p>
          </div>

          <Card className="p-6 sm:p-8 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about any bureaucratic procedure..."
                  className="h-14 pr-14 text-base bg-background"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!question.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Try:</span>
                {sampleQuestions.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleSampleClick(sample)}
                    className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                    disabled={isLoading}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Want full access? Create a free account to track your processes.
                </p>
                <Button variant="outline" asChild className="group gap-2">
                  <Link href="/register">
                    Create Account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
