"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  File,
  ListOrdered,
  AlertTriangle
} from "lucide-react"

// Extended type to include raw content fallback
interface BureaucracyResponse {
  procedureName: string
  difficulty: "easy" | "moderate" | "complex"
  totalEstimatedTime: string
  summary: string
  steps: Array<{
    number: number
    title: string
    description: string
    estimatedTime?: string
    tips?: string
  }>
  requiredDocuments: Array<{
    name: string
    description: string
    required: boolean
    whereToGet?: string
  }>
  officeInfo: {
    name: string
    address?: string
    website?: string
    phone?: string
    hours?: string
    appointmentRequired?: boolean
  }
  costs?: string
  additionalNotes?: string
  relatedProcedures?: string[]
  // Fallback for unstructured responses
  _rawContent?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
}

interface AnswerDisplayProps {
  response: BureaucracyResponse
}

export function AnswerDisplay({ response }: AnswerDisplayProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [checkedDocs, setCheckedDocs] = useState<string[]>([])
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const stepsProgress = response.steps.length > 0 
    ? (completedSteps.length / response.steps.length) * 100 
    : 0
  const docsProgress = response.requiredDocuments.length > 0 
    ? (checkedDocs.length / response.requiredDocuments.length) * 100 
    : 0

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(n => n !== stepNumber)
        : [...prev, stepNumber]
    )
  }

  const toggleDoc = (docName: string) => {
    setCheckedDocs(prev =>
      prev.includes(docName)
        ? prev.filter(n => n !== docName)
        : [...prev, docName]
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "moderate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "complex": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  // Check if we have structured data or need to show raw content
  const hasStructuredSteps = response.steps.length > 0 && response.steps[0]?.number > 0
  const hasRawContent = Boolean(response._rawContent)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Summary Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-primary overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={getDifficultyColor(response.difficulty)}>
                {response.difficulty}
              </Badge>
              {response.totalEstimatedTime && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {response.totalEstimatedTime}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{response.procedureName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{response.summary}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Show structured steps or raw content */}
      {hasStructuredSteps ? (
        <>
          {/* Steps Timeline */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListOrdered className="h-5 w-5 text-primary" />
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
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-4">
                    {response.steps.map((step) => {
                      const isCompleted = completedSteps.includes(step.number)
                      const isExpanded = expandedStep === step.number
                      
                      return (
                        <div key={step.number} className="relative pl-12">
                          {/* Step number circle */}
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

          {/* Document Checklist */}
          {response.requiredDocuments.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <File className="h-5 w-5 text-primary" />
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
                          <Checkbox 
                            checked={isChecked}
                            className="mt-0.5"
                          />
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
          )}
        </>
      ) : (
        /* Fallback: Show raw content in a tabbed view */
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Detailed Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="steps" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="steps" className="flex-1">
                    <ListOrdered className="h-4 w-4 mr-2" />
                    Steps
                  </TabsTrigger>
                  <TabsTrigger value="full" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Full Response
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="steps" className="mt-4">
                  {response._rawContent ? (
                    <div className="space-y-3">
                      {response._rawContent.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        
                        // Check if it's a numbered item or header
                        const isNumbered = /^\d+[\).]/.test(trimmed);
                        const isHeader = /^#+\s/.test(trimmed);
                        const isListItem = /^[-*•]\s/.test(trimmed);
                        
                        return (
                          <div 
                            key={i} 
                            className={`py-2 ${isHeader ? 'font-semibold text-lg mt-4 first:mt-0' : ''} ${isNumbered ? 'pl-4 border-l-2 border-primary/30' : ''} ${isListItem ? 'pl-4' : ''}`}
                          >
                            {trimmed}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No detailed instructions available.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="full" className="mt-4">
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm font-mono">
                    {response._rawContent || response.summary}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Office Info Card */}
      {response.officeInfo && response.officeInfo.name && (
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
                        Visit Website
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
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Additional Notes */}
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

      {/* Costs */}
      {response.costs && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">$</span>
                </div>
                <div>
                  <h4 className="font-medium">Estimated Costs</h4>
                  <p className="text-muted-foreground">{response.costs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
