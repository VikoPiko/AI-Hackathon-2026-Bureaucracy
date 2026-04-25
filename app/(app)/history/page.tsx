"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageSquare, FileText, Calendar, ArrowRight, Trash2, Sparkles, Edit3, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"
import { useQuestionHistory, type QuestionHistoryItem } from "@/hooks/use-question-history"

export default function HistoryPage() {
  const router = useRouter()
  const { translate: tr } = useI18n()
  const { history, isLoaded, deleteQuestion, clearHistory, searchHistory } = useQuestionHistory()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Handle clicking on a history item to continue the conversation
  const handleItemClick = (item: QuestionHistoryItem) => {
    // Navigate to ask page with the question pre-filled
    const encodedQuestion = encodeURIComponent(item.fullQuestion)
    router.push(`/ask?q=${encodedQuestion}&country=${item.country}&historyId=${item.id}`)
  }

  // Filter based on search and tab
  const filteredItems = searchHistory(searchQuery).filter((item) => {
    const matchesTab = activeTab === "all" || item.type === activeTab
    return matchesTab
  })

  // Loading state
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">{tr("history.title")}</h1>
          <p className="text-muted-foreground">
            {tr("history.subtitle")}
          </p>
        </motion.div>

        <Card className="p-12">
          <CardContent className="flex flex-col items-center justify-center text-center pt-6">
            <div className="space-y-4 w-full max-w-md">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tr("history.title")}</h1>
            <p className="text-muted-foreground">
              {tr("history.subtitle")}
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to clear all history?")) {
                  clearHistory()
                }
              }}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
        
        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {history.filter(h => h.type === "question").length} questions
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {history.filter(h => h.type === "document").length} documents
          </span>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tr("history.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              {tr("common.all")} ({history.length})
            </TabsTrigger>
            <TabsTrigger value="question">
              {tr("common.questions")} ({history.filter(h => h.type === "question").length})
            </TabsTrigger>
            <TabsTrigger value="document">
              {tr("common.documents")} ({history.filter(h => h.type === "document").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredItems.length === 0 ? (
              <Card className="p-12">
                <CardContent className="flex flex-col items-center justify-center text-center pt-6">
                  <Search className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium">
                    {searchQuery ? tr("common.noResults") : "No history yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery 
                      ? tr("history.noResultsBody")
                      : "Start asking questions to build your history"
                    }
                  </p>
                  {!searchQuery && (
                    <Button asChild className="mt-4 gap-2">
                      <Link href="/ask">
                        <Sparkles className="h-4 w-4" />
                        Ask your first question
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="hover:border-primary/30 transition-colors cursor-pointer group"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                            item.type === "question"
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {item.type === "question" ? (
                              <MessageSquare className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{item.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {item.country}
                              </Badge>
<Badge 
                                variant="outline"
                                className={`text-xs ${
                                  item.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}
                              >
                                {item.status === "completed" ? tr("common.completed") : tr("common.inProgress")}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.preview}
                            </p>

                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.date}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Edit button to continue */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleItemClick(item)
                              }}
                              title="Continue this conversation"
                            >
                              <Edit3 className="h-4 w-4 text-primary" />
                            </Button>
                            {/* Delete button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (confirm("Delete this item?")) {
                                  deleteQuestion(item.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center pt-4"
      >
        <Button asChild variant="outline" className="gap-2">
          <Link href="/ask">
            <MessageSquare className="h-4 w-4" />
            {tr("history.askNew")}
          </Link>
        </Button>
      </motion.div>
    </div>
  )
}
