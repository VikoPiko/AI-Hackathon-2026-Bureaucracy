"use client"

import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Download, ExternalLink, FileText, ShieldAlert } from "lucide-react"
import type { DocumentRisk } from "@/lib/types"
import {
  downloadDocumentChecklist,
  downloadDocumentReport,
} from "@/lib/reports"

interface DocumentAnalysisDisplayProps {
  question: string
  response: DocumentRisk
}

function getRiskColor(level: DocumentRisk["risk_level"]): string {
  switch (level) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

function getDifficultyColor(level: DocumentRisk["difficulty"]): string {
  switch (level) {
    case "easy":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "moderate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "complex":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function DocumentAnalysisDisplay({
  question,
  response,
}: DocumentAnalysisDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getRiskColor(response.risk_level)}>
                Risk: {response.risk_level}
              </Badge>
              <Badge variant="outline" className={getDifficultyColor(response.difficulty)}>
                Difficulty: {response.difficulty}
              </Badge>
              <Badge variant="secondary">Confidence: {Math.round(response.confidence * 100)}%</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadDocumentChecklist(question, response)}
              >
                <Download className="h-4 w-4" />
                Download Checklist
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadDocumentReport(question, response)}
              >
                <FileText className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
          <CardTitle className="text-xl">Document Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{response.summary}</p>
          <div className="rounded-lg border bg-secondary/40 p-4">
            <p className="text-sm font-medium mb-1">Overall Verdict</p>
            <p className="text-sm text-muted-foreground">{response.verdict}</p>
          </div>
        </CardContent>
      </Card>

      {response.key_points.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {response.key_points.map((item) => (
              <div key={item} className="rounded-lg border p-3 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {response.checklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {response.checklist.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border p-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {response.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {response.risks.map((risk, index) => (
              <div key={`${risk.clause}-${index}`} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{risk.clause}</p>
                  <Badge variant="outline" className={getRiskColor(risk.severity)}>
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{risk.risk}</p>
                <p className="text-sm"><span className="font-medium">Recommendation:</span> {risk.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Missing Clauses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {response.missing_clauses.length > 0 ? response.missing_clauses.map((item) => (
              <div key={item} className="rounded-lg border p-3 text-sm text-muted-foreground">
                {item}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No major missing clauses were identified.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Positive Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {response.positive_points.length > 0 ? response.positive_points.map((item) => (
              <div key={item} className="rounded-lg border p-3 text-sm text-muted-foreground">
                {item}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No significant positive protections were identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {response.used_sources && response.used_sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Used Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!response.used_sources.some((source) => source.is_official) && (
              <p className="text-sm text-muted-foreground">
                No official source was confirmed for this review. Treat it as guidance until you verify the cited rules.
              </p>
            )}
            {response.used_sources.map((source) => (
              <div key={`${source.title}-${source.url || "local"}`} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{source.title}</p>
                  <Badge variant={source.is_official ? "default" : "secondary"}>
                    {source.is_official ? "Official" : source.kind.replace("_", " ")}
                  </Badge>
                </div>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {source.url}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provided directly by the uploaded document.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {response.needs_more_context && (
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">More context would improve this review</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload the missing sections or answer these questions, then ask again.
                  </p>
                </div>
                {response.missing_context.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Missing context</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {response.missing_context.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {response.follow_up_questions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Follow-up questions</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {response.follow_up_questions.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
