import { z } from "zod"

export const stepSchema = z.object({
  number: z.number().describe("Step number in sequence"),
  title: z.string().describe("Brief title for this step"),
  description: z.string().describe("Detailed description of what to do"),
  estimatedTime: z.string().optional().describe("Estimated time to complete this step"),
  tips: z.string().optional().describe("Helpful tips for this step"),
})

export const documentSchema = z.object({
  name: z.string().describe("Name of the required document"),
  description: z.string().describe("What this document is and how to obtain it"),
  required: z.boolean().describe("Whether this document is mandatory"),
  whereToGet: z.string().optional().describe("Where to obtain this document"),
})

export const officeInfoSchema = z.object({
  name: z.string().describe("Name of the office or institution"),
  address: z.string().optional().describe("Physical address"),
  website: z.string().optional().describe("Official website URL"),
  phone: z.string().optional().describe("Contact phone number"),
  hours: z.string().optional().describe("Working hours"),
  appointmentRequired: z.boolean().optional().describe("Whether appointment is needed"),
})

export const sourceSchema = z.object({
  title: z.string().describe("Display title for the source"),
  url: z.string().nullable().optional().describe("Source URL when available"),
  kind: z.enum(["official", "knowledge_base", "document", "web"]).describe("Source type"),
  isOfficial: z.boolean().describe("Whether this source is official or public-service"),
})

export const bureaucracyResponseSchema = z.object({
  summary: z.string().describe("A clear, concise summary of the procedure in 2-3 sentences"),
  procedureName: z.string().describe("Official name of the bureaucratic procedure"),
  difficulty: z.enum(["easy", "moderate", "complex"]).describe("Difficulty level of the procedure"),
  totalEstimatedTime: z.string().describe("Total estimated time to complete the entire process"),
  steps: z.array(stepSchema).describe("Ordered list of steps to complete the procedure"),
  requiredDocuments: z.array(documentSchema).describe("List of all documents needed"),
  keyPoints: z.array(z.string()).optional().describe("Most important facts to remember"),
  checklist: z.array(z.string()).optional().describe("Actionable checklist items"),
  risks: z.array(z.string()).optional().describe("Potential risks, blockers, or failure modes"),
  positivePoints: z.array(z.string()).optional().describe("Helpful or favorable parts of the user's situation"),
  missingClauses: z.array(z.string()).optional().describe("Missing facts, protections, or requirements that still need confirmation"),
  officeInfo: officeInfoSchema.describe("Information about the relevant office"),
  costs: z.string().optional().describe("Any fees or costs involved"),
  additionalNotes: z.string().optional().describe("Important notes, warnings, or tips"),
  confidence: z.number().min(0).max(1).optional().describe("Model confidence for the structured answer"),
  answerable: z.boolean().optional().describe("Whether the current answer is reliable enough to use without more context"),
  needsMoreContext: z.boolean().optional().describe("Whether the user should gather more context before relying on the answer"),
  missingContext: z.array(z.string()).optional().describe("Specific missing information or evidence needed"),
  followUpQuestions: z.array(z.string()).optional().describe("Concrete follow-up questions for the user"),
  sources: z.array(sourceSchema).optional().describe("The sources used to build the answer"),
  relatedProcedures: z.array(z.string()).optional().describe("Related procedures the user might need"),
})

export type BureaucracyResponse = z.infer<typeof bureaucracyResponseSchema>
export type Step = z.infer<typeof stepSchema>
export type Document = z.infer<typeof documentSchema>
export type OfficeInfo = z.infer<typeof officeInfoSchema>
