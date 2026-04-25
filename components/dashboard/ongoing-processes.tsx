"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  Home, 
  Briefcase, 
  Receipt,
  GraduationCap,
  Car,
  HeartPulse,
  CheckCircle2,
  Circle,
  FileText,
  Calendar,
  AlertCircle,
  type LucideIcon
} from "lucide-react"
import Link from "next/link"

type ProcessType = "residency" | "business" | "tax" | "education" | "driving" | "healthcare"

interface ProcessStep {
  id: string
  name: string
  status: "completed" | "current" | "upcoming"
  description?: string
  date?: string
}

interface ProcessDocument {
  id: string
  name: string
  status: "submitted" | "pending" | "missing"
}

interface Process {
  id: string
  name: string
  type: ProcessType
  status: "in-progress" | "waiting" | "completed"
  progress: number
  nextStep: string
  dueDate?: string
  location?: string
  steps: ProcessStep[]
  documents: ProcessDocument[]
  estimatedCompletion?: string
  notes?: string
}

const processTypeConfig: Record<ProcessType, { icon: LucideIcon; color: string; bg: string }> = {
  residency: { icon: Home, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  business: { icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  tax: { icon: Receipt, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  education: { icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  driving: { icon: Car, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30" },
  healthcare: { icon: HeartPulse, color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
}

const processes: Process[] = [
  {
    id: "1",
    name: "Residence Permit Application",
    type: "residency",
    status: "in-progress",
    progress: 65,
    nextStep: "Submit biometric data",
    dueDate: "Dec 15, 2024",
    location: "Migration Office",
    estimatedCompletion: "Jan 10, 2025",
    notes: "Appointment confirmed for biometric data submission.",
    steps: [
      { id: "s1", name: "Initial Application", status: "completed", description: "Submit online application form", date: "Nov 1, 2024" },
      { id: "s2", name: "Document Submission", status: "completed", description: "Upload required documents", date: "Nov 8, 2024" },
      { id: "s3", name: "Fee Payment", status: "completed", description: "Pay application fee", date: "Nov 10, 2024" },
      { id: "s4", name: "Biometric Data", status: "current", description: "Visit office for fingerprints and photo", date: "Dec 15, 2024" },
      { id: "s5", name: "Final Review", status: "upcoming", description: "Wait for application review" },
      { id: "s6", name: "Permit Issuance", status: "upcoming", description: "Collect residence permit card" },
    ],
    documents: [
      { id: "d1", name: "Passport Copy", status: "submitted" },
      { id: "d2", name: "Proof of Address", status: "submitted" },
      { id: "d3", name: "Employment Contract", status: "submitted" },
      { id: "d4", name: "Health Insurance", status: "pending" },
      { id: "d5", name: "Bank Statement", status: "submitted" },
    ],
  },
  {
    id: "2",
    name: "Business Registration",
    type: "business",
    status: "waiting",
    progress: 40,
    nextStep: "Waiting for document approval",
    dueDate: "Dec 20, 2024",
    estimatedCompletion: "Jan 5, 2025",
    notes: "Documents under review by the registry office.",
    steps: [
      { id: "s1", name: "Name Reservation", status: "completed", description: "Reserve company name", date: "Nov 15, 2024" },
      { id: "s2", name: "Document Preparation", status: "completed", description: "Prepare founding documents", date: "Nov 20, 2024" },
      { id: "s3", name: "Document Submission", status: "current", description: "Submit to registry office" },
      { id: "s4", name: "Registry Approval", status: "upcoming", description: "Wait for official approval" },
      { id: "s5", name: "Tax Registration", status: "upcoming", description: "Register with tax authority" },
    ],
    documents: [
      { id: "d1", name: "Articles of Association", status: "submitted" },
      { id: "d2", name: "Founder ID Copies", status: "submitted" },
      { id: "d3", name: "Office Lease Agreement", status: "missing" },
      { id: "d4", name: "Bank Account Proof", status: "pending" },
    ],
  },
  {
    id: "3",
    name: "Tax ID Application",
    type: "tax",
    status: "in-progress",
    progress: 85,
    nextStep: "Collect final document",
    location: "Tax Office",
    estimatedCompletion: "Dec 10, 2024",
    steps: [
      { id: "s1", name: "Application Form", status: "completed", description: "Fill out tax registration form", date: "Nov 25, 2024" },
      { id: "s2", name: "Identity Verification", status: "completed", description: "Verify identity at office", date: "Nov 28, 2024" },
      { id: "s3", name: "Processing", status: "completed", description: "Application processing", date: "Dec 1, 2024" },
      { id: "s4", name: "Document Collection", status: "current", description: "Collect Tax ID certificate" },
    ],
    documents: [
      { id: "d1", name: "ID Document", status: "submitted" },
      { id: "d2", name: "Proof of Address", status: "submitted" },
      { id: "d3", name: "Application Form", status: "submitted" },
    ],
  },
]

const statusConfig = {
  "in-progress": { label: "In Progress", className: "bg-primary/10 text-primary border-primary/20" },
  "waiting": { label: "Waiting", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  "completed": { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
}

const documentStatusConfig = {
  submitted: { label: "Submitted", icon: CheckCircle2, className: "text-green-600" },
  pending: { label: "Pending", icon: Clock, className: "text-amber-600" },
  missing: { label: "Missing", icon: AlertCircle, className: "text-red-600" },
}

export function OngoingProcesses() {
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ongoing Processes</CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/history">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {processes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ongoing processes</p>
              <Button asChild className="mt-4">
                <Link href="/ask">Start a new inquiry</Link>
              </Button>
            </div>
          ) : (
            processes.map((process, index) => {
              const typeConfig = processTypeConfig[process.type]
              const TypeIcon = typeConfig.icon
              
              return (
                <motion.div
                  key={process.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedProcess(process)}
                  className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      {/* Process Type Icon */}
                      <div className={`shrink-0 h-10 w-10 rounded-lg ${typeConfig.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{process.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={statusConfig[process.status].className}
                          >
                            {statusConfig[process.status].label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {process.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {process.dueDate}
                            </span>
                          )}
                          {process.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {process.location}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm">
                          <span className="text-muted-foreground">Next: </span>
                          <span className="font-medium">{process.nextStep}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="sm:w-32 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{process.progress}%</span>
                      </div>
                      <Progress value={process.progress} className="h-2" />
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Process Detail Dialog */}
      <Dialog open={!!selectedProcess} onOpenChange={() => setSelectedProcess(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedProcess && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl ${processTypeConfig[selectedProcess.type].bg} flex items-center justify-center`}>
                    {(() => {
                      const TypeIcon = processTypeConfig[selectedProcess.type].icon
                      return <TypeIcon className={`h-6 w-6 ${processTypeConfig[selectedProcess.type].color}`} />
                    })()}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedProcess.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={statusConfig[selectedProcess.status].className}
                      >
                        {statusConfig[selectedProcess.status].label}
                      </Badge>
                      <span>{selectedProcess.progress}% complete</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{selectedProcess.progress}%</span>
                  </div>
                  <Progress value={selectedProcess.progress} className="h-3" />
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedProcess.dueDate && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        Next Deadline
                      </div>
                      <p className="font-medium">{selectedProcess.dueDate}</p>
                    </div>
                  )}
                  {selectedProcess.estimatedCompletion && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        Est. Completion
                      </div>
                      <p className="font-medium">{selectedProcess.estimatedCompletion}</p>
                    </div>
                  )}
                  {selectedProcess.location && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                      <p className="font-medium">{selectedProcess.location}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedProcess.notes && (
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm text-muted-foreground">{selectedProcess.notes}</p>
                  </div>
                )}

                {/* Steps Timeline */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Process Steps
                  </h4>
                  <div className="space-y-1">
                    {selectedProcess.steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3"
                      >
                        {/* Timeline line and dot */}
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                            step.status === "completed" 
                              ? "bg-green-100 dark:bg-green-900/30" 
                              : step.status === "current"
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "bg-secondary"
                          }`}>
                            {step.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : step.status === "current" ? (
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {index < selectedProcess.steps.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[24px] ${
                              step.status === "completed" ? "bg-green-300 dark:bg-green-800" : "bg-border"
                            }`} />
                          )}
                        </div>
                        
                        {/* Step content */}
                        <div className="pb-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${
                              step.status === "upcoming" ? "text-muted-foreground" : ""
                            }`}>
                              {step.name}
                            </p>
                            {step.date && (
                              <span className="text-xs text-muted-foreground">{step.date}</span>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Documents Checklist */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Required Documents
                  </h4>
                  <div className="space-y-2">
                    {selectedProcess.documents.map((doc, index) => {
                      const statusConf = documentStatusConfig[doc.status]
                      const StatusIcon = statusConf.icon
                      
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                        >
                          <span className="text-sm">{doc.name}</span>
                          <div className={`flex items-center gap-1.5 text-sm ${statusConf.className}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span>{statusConf.label}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" asChild>
                    <Link href="/ask">Ask a Question</Link>
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProcess(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
