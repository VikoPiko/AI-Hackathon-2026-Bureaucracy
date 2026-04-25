"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Landmark,
  ListChecks,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react"
import type { BureaucracyResponse } from "@/lib/ai/schemas"
import {
  downloadProcedureChecklist,
  downloadProcedureReport,
} from "@/lib/reports"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.4, 0.25, 1] },
  },
} as const

interface AnswerDisplayProps {
  question?: string
  response: BureaucracyResponse
}

function InfoListCard({
  title,
  items,
  empty,
  icon,
}: {
  title: string
  items?: string[]
  empty?: string
  icon?: ReactNode
}) {
  if ((!items || items.length === 0) && !empty) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items && items.length > 0 ? items.map((item) => (
          <div key={item} className="rounded-lg border p-3 text-sm text-muted-foreground">
            {item}
          </div>
        )) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  )
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
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

function getConfidenceLabel(confidence?: number) {
  if (typeof confidence !== "number") {
    return "Not scored"
  }

  if (confidence >= 0.85) return "High confidence"
  if (confidence >= 0.65) return "Good confidence"
  if (confidence >= 0.45) return "Needs verification"
  return "Low confidence"
}

function getSourceTrust(response: BureaucracyResponse) {
  const officialCount = response.sources?.filter((source) => source.isOfficial).length ?? 0

  if (officialCount > 0) {
    return {
      label: `${officialCount} official source${officialCount === 1 ? "" : "s"}`,
      detail: "Grounded with government or public-service references.",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    }
  }

  if (response.sources && response.sources.length > 0) {
    return {
      label: "Source review needed",
      detail: "Useful context was found, but no official source was confirmed.",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    }
  }

  return {
    label: "No source attached",
    detail: "Treat this as a starting point until official sources are verified.",
    className: "border-muted bg-muted/40 text-muted-foreground",
  }
}

function getNextActions(response: BureaucracyResponse): string[] {
  if (response.checklist && response.checklist.length > 0) {
    return response.checklist.slice(0, 4)
  }

  return response.steps.slice(0, 4).map((step) => step.description)
}

export function AnswerDisplay({ question = "Procedure guidance", response }: AnswerDisplayProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [checkedDocs, setCheckedDocs] = useState<string[]>([])
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const sourceTrust = getSourceTrust(response)
  const nextActions = getNextActions(response)

  const stepsProgress = response.steps.length > 0
    ? (completedSteps.length / response.steps.length) * 100
    : 0
  const docsProgress = response.requiredDocuments.length > 0
    ? (checkedDocs.length / response.requiredDocuments.length) * 100
    : 0

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((n) => n !== stepNumber)
        : [...prev, stepNumber],
    )
  }

  const toggleDoc = (docName: string) => {
    setCheckedDocs((prev) =>
      prev.includes(docName)
        ? prev.filter((n) => n !== docName)
        : [...prev, docName],
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getDifficultyColor(response.difficulty)}>
                  {response.difficulty}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {response.totalEstimatedTime}
                </Badge>
                {typeof response.confidence === "number" && (
                  <Badge variant="secondary">
                    {getConfidenceLabel(response.confidence)} · {Math.round(response.confidence * 100)}%
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => downloadProcedureChecklist(question, response)}
                >
                  <Download className="h-4 w-4" />
                  Download Checklist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => downloadProcedureReport(question, response)}
                >
                  <FileText className="h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                FormWise Case File
              </p>
              <CardTitle className="text-2xl">{response.procedureName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {response.summary}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Timeline
                </p>
                <p className="mt-1 text-sm font-semibold">{response.totalEstimatedTime}</p>
              </div>
              <div className="rounded-xl border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Readiness
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {response.needsMoreContext ? "Needs your details" : "Ready for next steps"}
                </p>
              </div>
              <div className={`rounded-xl border p-4 ${sourceTrust.className}`}>
                <p className="text-xs font-medium uppercase tracking-wide">Source trust</p>
                <p className="mt-1 text-sm font-semibold">{sourceTrust.label}</p>
              </div>
            </div>
            {response.needsMoreContext && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div className="space-y-1">
                    <p className="font-medium">Personal details would make this safer</p>
                    <p className="text-sm text-muted-foreground">
                      The general guidance is available, but the final eligibility or deadline may depend on your exact status.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {nextActions.length > 0 && (
              <div className="rounded-xl border bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Recommended next actions</h4>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {nextActions.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex gap-3 rounded-lg bg-card p-3 text-sm">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {response.keyPoints && response.keyPoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Points</h4>
                <div className="flex flex-wrap gap-2">
                  {response.keyPoints.map((point) => (
                    <Badge key={point} variant="secondary" className="whitespace-normal text-left">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{sourceTrust.detail}</p>
          </CardContent>
        </Card>
      </motion.div>

      {(response.legalBasis?.length || response.covers?.length || response.notCovered?.length) ? (
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
          <InfoListCard
            title="Legal Basis"
            items={response.legalBasis}
            icon={<Landmark className="h-5 w-5 text-primary" />}
          />
          <InfoListCard
            title="This Covers"
            items={response.covers}
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          />
          <InfoListCard
            title="Not Covered"
            items={response.notCovered}
            icon={<AlertCircle className="h-5 w-5 text-primary" />}
          />
        </motion.div>
      ) : null}

      {(response.eligibility?.length || response.prerequisites?.length || response.exceptions?.length) ? (
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
          <InfoListCard
            title="Eligibility"
            items={response.eligibility}
            icon={<Sparkles className="h-5 w-5 text-primary" />}
          />
          <InfoListCard
            title="Prerequisites"
            items={response.prerequisites}
            icon={<FileText className="h-5 w-5 text-primary" />}
          />
          <InfoListCard
            title="Exceptions"
            items={response.exceptions}
            icon={<TriangleAlert className="h-5 w-5 text-primary" />}
          />
        </motion.div>
      ) : null}

      {response.checklist && response.checklist.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {response.checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border p-3 bg-card"
                >
                  <Checkbox checked={false} />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <InfoListCard
          title="Timeline Details"
          items={response.timelineDetails}
          empty={response.totalEstimatedTime}
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        <InfoListCard
          title="Cost Breakdown"
          items={response.costBreakdown}
          empty={response.costs || "No grounded fee breakdown was confirmed."}
          icon={<FileText className="h-5 w-5 text-primary" />}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <InfoListCard
          title="Potential Risks"
          items={response.risks}
          empty="No major risks were identified from the available context."
          icon={<ShieldAlert className="h-5 w-5 text-primary" />}
        />
        <InfoListCard
          title="Positive Points"
          items={response.positivePoints}
          empty="No strong positive factors were confirmed from the available context."
          icon={<ThumbsUp className="h-5 w-5 text-primary" />}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <InfoListCard
          title="Missing Confirmations"
          items={response.missingClauses}
          empty="No major missing confirmations were identified."
          icon={<AlertCircle className="h-5 w-5 text-primary" />}
        />
        <InfoListCard
          title="Common Mistakes"
          items={response.commonMistakes}
          empty="No common failure modes were confidently identified."
          icon={<TriangleAlert className="h-5 w-5 text-primary" />}
        />
      </motion.div>

      {(response.scamsToAvoid?.length || response.whatNotToDo?.length) ? (
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
          <InfoListCard
            title="Scams To Avoid"
            items={response.scamsToAvoid}
            empty="No specific scam pattern was confirmed from the official context."
            icon={<ShieldAlert className="h-5 w-5 text-primary" />}
          />
          <InfoListCard
            title="What Not To Do"
            items={response.whatNotToDo}
            empty="No special prohibitions were confirmed beyond the normal process."
            icon={<AlertCircle className="h-5 w-5 text-primary" />}
          />
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Steps to Complete
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {completedSteps.length}/{response.steps.length} completed
              </span>
            </div>
            <Progress value={stepsProgress} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {response.steps.map((step) => {
                  const isCompleted = completedSteps.includes(step.number)
                  const isExpanded = expandedStep === step.number

                  return (
                    <div key={step.number} className="relative pl-12">
                      <motion.button
                        onClick={() => toggleStep(step.number)}
                        whileTap={{ scale: 0.95 }}
                        className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{step.number}</span>
                        )}
                      </motion.button>

                      <div
                        className={`rounded-lg border p-4 transition-all ${
                          isCompleted ? "bg-primary/5 border-primary/20" : "bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {step.title}
                            </h4>
                            {step.estimatedTime && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {step.estimatedTime}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-border"
                          >
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            {step.tips && (
                              <p className="text-sm text-accent mt-2 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                {step.tips}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Required Documents
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {checkedDocs.length}/{response.requiredDocuments.length} ready
              </span>
            </div>
            <Progress value={docsProgress} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {response.requiredDocuments.map((doc) => {
                const isChecked = checkedDocs.includes(doc.name)

                return (
                  <motion.div
                    key={doc.name}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleDoc(doc.name)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card hover:border-primary/30"
                    }`}
                  >
                    <Checkbox checked={isChecked} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                          {doc.name}
                        </span>
                        <Badge variant={doc.required ? "default" : "secondary"} className="text-xs">
                          {doc.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      {doc.whereToGet && (
                        <p className="text-xs text-accent mt-1">Where to get: {doc.whereToGet}</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-secondary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Where to Go
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">{response.officeInfo.name}</h4>

              {response.officeInfo.address && (
                <p className="text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-1" />
                  {response.officeInfo.address}
                </p>
              )}

              {response.officeInfo.hours && (
                <p className="text-muted-foreground flex items-start gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 mt-1" />
                  {response.officeInfo.hours}
                </p>
              )}

              {response.officeInfo.phone && (
                <p className="text-muted-foreground flex items-start gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 mt-1" />
                  {response.officeInfo.phone}
                </p>
              )}

              {response.officeInfo.appointmentRequired && (
                <p className="text-accent flex items-start gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0 mt-1" />
                  Appointment required
                </p>
              )}

              <div className="flex gap-3 pt-2">
                {response.officeInfo.website && (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a href={response.officeInfo.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Official Source
                    </a>
                  </Button>
                )}
                {response.officeInfo.address && (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(response.officeInfo.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4" />
                      View on Map
                    </a>
                  </Button>
                )}
              </div>
              {!response.officeInfo.website && response.sources && response.sources.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  No official source was confirmed for this answer. Review the used sources below before relying on it.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {(response.relatedProcedures?.length || response.followUpQuestions?.length) ? (
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
          <InfoListCard
            title="Related Procedures"
            items={response.relatedProcedures}
            empty="No adjacent procedure was confidently identified."
            icon={<FileText className="h-5 w-5 text-primary" />}
          />
          <InfoListCard
            title="Useful Follow-up Questions"
            items={response.followUpQuestions}
            empty="No follow-up prompts were suggested."
            icon={<Sparkles className="h-5 w-5 text-primary" />}
          />
        </motion.div>
      ) : null}

      {response.additionalNotes && (
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Important Notes</h4>
                  <p className="text-muted-foreground">{response.additionalNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {response.sources && response.sources.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Used Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {response.sources.map((source) => (
                <div key={`${source.title}-${source.url || "local"}`} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{source.title}</p>
                    <Badge variant={source.isOfficial ? "default" : "secondary"}>
                      {source.isOfficial ? "Official" : source.kind.replace("_", " ")}
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
                      Provided directly by the uploaded document or local knowledge base.
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
