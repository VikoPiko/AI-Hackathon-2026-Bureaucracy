"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Clock, FileText, ChevronRight } from "lucide-react"
import type { Category } from "./browse-categories"

interface Procedure {
  id: string
  name: string
  description: string
  difficulty: "easy" | "moderate" | "complex"
  estimatedTime: string
  documentsRequired: number
}

const proceduresByCategory: Record<string, Procedure[]> = {
  residency: [
    {
      id: "res-1",
      name: "Long-term Residence Permit",
      description: "Apply for a long-term residence permit for stays over 90 days",
      difficulty: "moderate",
      estimatedTime: "2-4 weeks",
      documentsRequired: 8,
    },
    {
      id: "res-2",
      name: "Permanent Residence",
      description: "Apply for permanent residence after 5 years of continuous stay",
      difficulty: "complex",
      estimatedTime: "1-3 months",
      documentsRequired: 12,
    },
    {
      id: "res-3",
      name: "Family Reunification Visa",
      description: "Bring family members to join you in the country",
      difficulty: "complex",
      estimatedTime: "2-6 months",
      documentsRequired: 15,
    },
    {
      id: "res-4",
      name: "Address Registration",
      description: "Register your residential address with local authorities",
      difficulty: "easy",
      estimatedTime: "1-2 days",
      documentsRequired: 3,
    },
  ],
  work: [
    {
      id: "work-1",
      name: "Work Permit Application",
      description: "Apply for authorization to work in the country",
      difficulty: "moderate",
      estimatedTime: "2-4 weeks",
      documentsRequired: 10,
    },
    {
      id: "work-2",
      name: "Blue Card (EU)",
      description: "EU Blue Card for highly qualified workers",
      difficulty: "complex",
      estimatedTime: "1-2 months",
      documentsRequired: 12,
    },
    {
      id: "work-3",
      name: "Freelance Registration",
      description: "Register as a freelancer or self-employed individual",
      difficulty: "moderate",
      estimatedTime: "1-3 weeks",
      documentsRequired: 7,
    },
  ],
  business: [
    {
      id: "biz-1",
      name: "Company Registration (LLC)",
      description: "Register a limited liability company",
      difficulty: "moderate",
      estimatedTime: "1-2 weeks",
      documentsRequired: 8,
    },
    {
      id: "biz-2",
      name: "Tax ID Registration",
      description: "Obtain a tax identification number for your business",
      difficulty: "easy",
      estimatedTime: "3-5 days",
      documentsRequired: 4,
    },
    {
      id: "biz-3",
      name: "Business License",
      description: "Obtain required licenses for your business activity",
      difficulty: "moderate",
      estimatedTime: "2-4 weeks",
      documentsRequired: 6,
    },
  ],
  healthcare: [
    {
      id: "health-1",
      name: "Health Insurance Registration",
      description: "Register for mandatory health insurance coverage",
      difficulty: "easy",
      estimatedTime: "1-2 weeks",
      documentsRequired: 4,
    },
    {
      id: "health-2",
      name: "GP Registration",
      description: "Register with a general practitioner",
      difficulty: "easy",
      estimatedTime: "1-3 days",
      documentsRequired: 2,
    },
  ],
  education: [
    {
      id: "edu-1",
      name: "University Enrollment",
      description: "Apply for admission to a university",
      difficulty: "moderate",
      estimatedTime: "1-3 months",
      documentsRequired: 10,
    },
    {
      id: "edu-2",
      name: "Diploma Recognition",
      description: "Get your foreign diploma recognized",
      difficulty: "complex",
      estimatedTime: "1-4 months",
      documentsRequired: 8,
    },
  ],
  driving: [
    {
      id: "drive-1",
      name: "Driver License Exchange",
      description: "Exchange your foreign driver's license",
      difficulty: "moderate",
      estimatedTime: "2-4 weeks",
      documentsRequired: 5,
    },
    {
      id: "drive-2",
      name: "Vehicle Registration",
      description: "Register a vehicle in your name",
      difficulty: "moderate",
      estimatedTime: "1-2 weeks",
      documentsRequired: 6,
    },
  ],
  travel: [
    {
      id: "travel-1",
      name: "Passport Application",
      description: "Apply for a new passport",
      difficulty: "easy",
      estimatedTime: "2-4 weeks",
      documentsRequired: 4,
    },
    {
      id: "travel-2",
      name: "Travel Document for Refugees",
      description: "Apply for travel documents as a refugee or asylum seeker",
      difficulty: "complex",
      estimatedTime: "1-3 months",
      documentsRequired: 8,
    },
  ],
  general: [
    {
      id: "gen-1",
      name: "Birth Certificate Request",
      description: "Request a copy of your birth certificate",
      difficulty: "easy",
      estimatedTime: "1-2 weeks",
      documentsRequired: 2,
    },
    {
      id: "gen-2",
      name: "Criminal Record Certificate",
      description: "Obtain a criminal record certificate",
      difficulty: "easy",
      estimatedTime: "1-3 weeks",
      documentsRequired: 3,
    },
    {
      id: "gen-3",
      name: "Notarized Document Translation",
      description: "Get official documents translated and notarized",
      difficulty: "easy",
      estimatedTime: "3-7 days",
      documentsRequired: 2,
    },
  ],
}

const difficultyConfig = {
  easy: { label: "Easy", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  moderate: { label: "Moderate", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  complex: { label: "Complex", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

interface ProcedureListProps {
  category: Category
  onBack: () => void
  onSelectProcedure: (procedure: Procedure) => void
}

export function ProcedureList({ category, onBack, onSelectProcedure }: ProcedureListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const procedures = proceduresByCategory[category.id] || []
  
  const filteredProcedures = procedures.filter((proc) =>
    proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proc.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${category.color}`}>
            <category.icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <p className="text-sm text-muted-foreground">{category.procedureCount} procedures</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search procedures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Procedure List */}
      <div className="space-y-3">
        {filteredProcedures.length === 0 ? (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center text-center pt-6">
              <Search className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-medium">No procedures found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProcedures.map((procedure, index) => (
            <motion.div
              key={procedure.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                onClick={() => onSelectProcedure(procedure)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{procedure.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={difficultyConfig[procedure.difficulty].className}
                        >
                          {difficultyConfig[procedure.difficulty].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {procedure.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {procedure.estimatedTime}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {procedure.documentsRequired} documents
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
