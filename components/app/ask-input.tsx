"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Loader2, Upload, X, FileText } from "lucide-react"

interface AskInputProps {
  onSubmit: (question: string, file?: File) => void
  isLoading?: boolean
  placeholder?: string
}

export function AskInput({ onSubmit, isLoading, placeholder }: AskInputProps) {
  const [question, setQuestion] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim() && !isLoading) {
      onSubmit(question.trim(), file || undefined)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile)
    }
  }

  const isValidFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ]
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB limit
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (file: File) => {
    return <FileText className="h-5 w-5" />
  }

  return (
    <Card 
      className={`p-6 transition-all ${isDragging ? "border-primary border-dashed bg-primary/5" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={placeholder || "Ask about any bureaucratic procedure... e.g., 'How do I apply for a residence permit in Bulgaria?'"}
            className="min-h-[120px] resize-none text-base pr-12"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
        </div>

        {/* File attachment */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getFileIcon(file)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeFile}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Attach Document
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              PDF, DOCX, DOC, or TXT up to 10MB
            </span>
          </div>

          <Button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Ask
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5"
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Drop your document here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
