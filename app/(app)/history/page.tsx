"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageSquare, FileText, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { readHistory, type HistoryEntry } from "@/lib/history/storage"

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setHistoryItems(readHistory())
  }, [])

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTab = activeTab === "all" || item.type === activeTab
      return matchesSearch && matchesTab
    })
  }, [activeTab, historyItems, searchQuery])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">
          Browse your real questions and document analyses from this browser.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="question">Questions</TabsTrigger>
            <TabsTrigger value="document">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredItems.length === 0 ? (
              <Card className="p-12">
                <CardContent className="flex flex-col items-center justify-center text-center pt-6">
                  <Search className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask a question or analyze a document to start building your history.
                  </p>
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
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                              item.type === "question"
                                ? "bg-primary/10 text-primary"
                                : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {item.type === "question" ? (
                              <MessageSquare className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{item.title}</h3>
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Completed
                              </Badge>
                              {item.fileName && (
                                <Badge variant="secondary">{item.fileName}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.preview}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {item.question}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.createdAt), "MMM d, yyyy")}
                              </span>
                              <span className="text-xs text-muted-foreground uppercase">
                                {item.country}
                              </span>
                            </div>
                          </div>

                          <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <Link href="/ask">
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center pt-4"
      >
        <Button asChild variant="outline" className="gap-2">
          <Link href="/ask">
            <MessageSquare className="h-4 w-4" />
            Ask a new question
          </Link>
        </Button>
      </motion.div>
    </div>
  )
}
