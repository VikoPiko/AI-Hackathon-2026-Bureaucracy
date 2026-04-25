"use client"

import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Briefcase, 
  Building2, 
  Heart, 
  GraduationCap, 
  Car,
  Plane,
  FileText,
  type LucideIcon
} from "lucide-react"

export interface Category {
  id: string
  name: string
  description: string
  icon: LucideIcon
  procedureCount: number
  color: string
}

export const categories: Category[] = [
  {
    id: "residency",
    name: "Residency & Visas",
    description: "Residence permits, visa applications, and immigration procedures",
    icon: Home,
    procedureCount: 12,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "work",
    name: "Work Permits",
    description: "Employment authorization and work-related permits",
    icon: Briefcase,
    procedureCount: 8,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: "business",
    name: "Business & Company",
    description: "Company registration, business licenses, and commercial permits",
    icon: Building2,
    procedureCount: 15,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Health insurance, medical registration, and healthcare access",
    icon: Heart,
    procedureCount: 6,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
  {
    id: "education",
    name: "Education",
    description: "School enrollment, university applications, and academic credentials",
    icon: GraduationCap,
    procedureCount: 9,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: "driving",
    name: "Driving & Vehicles",
    description: "Driver's license, vehicle registration, and traffic permits",
    icon: Car,
    procedureCount: 7,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    id: "travel",
    name: "Travel & Documents",
    description: "Passport, travel documents, and international permits",
    icon: Plane,
    procedureCount: 5,
    color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  },
  {
    id: "general",
    name: "General Administration",
    description: "Address registration, certificates, and general paperwork",
    icon: FileText,
    procedureCount: 11,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

interface BrowseCategoriesProps {
  onSelectCategory: (category: Category) => void
}

export function BrowseCategories({ onSelectCategory }: BrowseCategoriesProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {categories.map((category) => (
        <motion.div key={category.id} variants={itemVariants}>
          <Card 
            className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group"
            onClick={() => onSelectCategory(category)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${category.color}`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {category.description}
                  </p>
                  <Badge variant="secondary" className="mt-3">
                    {category.procedureCount} procedures
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
