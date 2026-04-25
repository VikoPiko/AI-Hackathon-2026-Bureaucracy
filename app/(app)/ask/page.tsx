"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AskInput } from "@/components/app/ask-input";
import { AnswerDisplay } from "@/components/app/answer-display";
import { DocumentAnalysisDisplay } from "@/components/app/document-analysis-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Lightbulb, X, RotateCcw, AlertCircle, MessageCircle, ChevronRight, Clock, MapPin } from "lucide-react";
import type { BureaucracyResponse } from "@/lib/ai/schemas";
import { getCountryName } from "@/components/app/country-selector";
import { format } from "date-fns";

// Document Risk response type
interface DocumentRiskResponse {
  risk_level: "low" | "medium" | "high";
  summary: string;
  risks: Array<{
    clause: string;
    risk: string;
    severity: "low" | "medium" | "high";
    recommendation: string;
  }>;
  missing_clauses: string[];
  positive_points: string[];
  verdict: string;
  _rawContent?: string;
}

// Conversation message type
interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  country?: string;
  response?: BureaucracyResponse;
  documentAnalysis?: DocumentRiskResponse;
}

// Suggested follow-up questions type
interface SuggestedFollowUp {
  question: string;
  category: string;
}

const suggestions = [
  "How do I get a residence permit?",
  "What documents do I need to register a company?",
  "How to apply for a work visa?",
  "What is the process to renew my passport?",
];

// Default follow-up suggestions based on procedure type
const defaultFollowUps: Record<string, SuggestedFollowUp[]> = {
  default: [
    { question: "What are the exact requirements?", category: "Requirements" },
    { question: "How long does this take?", category: "Timeline" },
    { question: "What is the total cost?", category: "Costs" },
    { question: "Where exactly do I need to go?", category: "Location" },
  ],
  visa: [
    { question: "Can I work with this visa?", category: "Work Rights" },
    { question: "Can I bring my family?", category: "Family" },
    { question: "What happens if my application is rejected?", category: "Rejection" },
  ],
  permit: [
    { question: "Can I extend this permit?", category: "Extension" },
    { question: "What are the conditions for renewal?", category: "Renewal" },
    { question: "Can I change my status?", category: "Status Change" },
  ],
};

function AskPageInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [bureaucracyResponse, setBureaucracyResponse] = useState<BureaucracyResponse & { _generatedAt?: string } | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentRiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCountry, setLastCountry] = useState<string>("BG");
  const [prefill, setPrefill] = useState<string>(initialQ);
  const [needsMoreInfo, setNeedsMoreInfo] = useState<boolean>(false);

  // Conversation history state
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState<boolean>(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<SuggestedFollowUp[]>(defaultFollowUps.default);
  
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (showConversation && conversationHistory.length > 0) {
      scrollToBottom();
    }
  }, [conversationHistory, showConversation, scrollToBottom]);

  const handleSubmit = async (question: string, file?: File, country?: string) => {
    // Validate that country is selected
    if (!country) {
      toast.error("Please select a country", {
        description: "This helps us provide accurate information.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastCountry(country);
    setPrefill("");
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setNeedsMoreInfo(false);

    // Generate unique ID for this question
    const questionId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentQuestionId(questionId);

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: questionId,
      role: "user",
      content: question,
      timestamp: new Date(),
      country,
    };

    if (showConversation) {
      setConversationHistory(prev => [...prev, userMessage]);
      scrollToBottom();
    }

    const countryName = getCountryName(country);
    
    const loadingToast = toast.loading(`Analyzing for ${countryName}...`, {
      description: "FormWise is searching the knowledge base and official sources.",
    });

    try {
      let documentText: string | undefined;
      
      // Extract text from attached file using server-side API (PDF, DOCX)
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const extractRes = await fetch("/api/extract-text", {
            method: "POST",
            body: formData,
          });
          
          if (extractRes.ok) {
            const extractData = await extractRes.json();
            documentText = extractData.text;
          } else {
            console.error("File extraction failed:", await extractRes.text());
            toast.warning("Could not read file content", {
              description: "Sending question without file content.",
            });
          }
        } catch (err) {
          console.error("File extraction error:", err);
          toast.warning("Could not read file content", {
            description: "Sending question without file content.",
          });
        }
      }

      // Determine if this is a follow-up question
      const isFollowUp = showConversation && conversationHistory.length > 0;

      // Build conversation history for API
      const apiHistory = conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the analyze API with country and conversation context
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentText || question,
          country: country,
          language: "en",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze");
      }

      const data = await res.json();

      // Check if the response indicates insufficient information
      if (data._needsMoreInfo || (data.risk_level === 'unknown' && data._rawContent?.includes('more specific'))) {
        setNeedsMoreInfo(true);
        setError(`We need more specific information about your question for ${countryName}.`);
        toast.dismiss(loadingToast);
        toast.info("Please provide more details", {
          description: `For ${countryName}, we need specific details to help you better.`,
        });
        return;
      }

      // Check if it's document analysis response (has risk_level) or procedure response (has steps)
      if (data.risk_level) {
        // Document risk analysis response
        setDocumentAnalysis(data);
        toast.success("Analysis complete", {
          id: loadingToast,
          description: `Document analyzed for ${countryName} jurisdiction.`,
        });
      } else if (data.response) {
        // Bureaucracy procedure response (wrapped in response)
        setBureaucracyResponse(data.response);
        toast.success("Answer ready", {
          id: loadingToast,
          description: `Procedure information for ${countryName}.`,
        });
      } else if (data.procedureName || data.steps) {
        // Direct procedure response
        setBureaucracyResponse(data);
        toast.success("Answer ready", {
          id: loadingToast,
          description: `Procedure information for ${countryName}.`,
        });
      } else {
        // Unexpected response format
        setNeedsMoreInfo(true);
        setError(`We couldn't find specific information for ${countryName}. Please try a more specific question or check if you're asking about the correct country.`);
        toast.dismiss(loadingToast);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze your question. Please try again.");
      toast.error("Couldn't fetch the answer", {
        id: loadingToast,
        description: "Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow-up question from suggestion
  const handleFollowUp = async (followUpQuestion: string) => {
    if (!lastCountry) {
      toast.error("Please select a country first");
      return;
    }
    setPrefill(followUpQuestion);
    await handleSubmit(followUpQuestion, undefined, lastCountry);
  };

  // Handle submitting from input (with conversation context)
  const handleInputSubmit = async (question: string, file?: File, country?: string) => {
    if (!country) {
      toast.error("Please select a country", {
        description: "This helps us provide accurate information.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastCountry(country);
    setPrefill("");
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setNeedsMoreInfo(false);

    // Generate unique ID for this question
    const questionId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentQuestionId(questionId);

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: questionId,
      role: "user",
      content: question,
      timestamp: new Date(),
      country,
    };

    setConversationHistory(prev => [...prev, userMessage]);

    const countryName = getCountryName(country);
    
    const loadingToast = toast.loading(`Searching for ${countryName}...`, {
      description: "FormWise is providing detailed guidance.",
    });

    try {
      let documentText: string | undefined;
      
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const extractRes = await fetch("/api/extract-text", {
            method: "POST",
            body: formData,
          });
          
          if (extractRes.ok) {
            const extractData = await extractRes.json();
            documentText = extractData.text;
          }
        } catch (err) {
          console.error("File extraction error:", err);
        }
      }

      // Build conversation context (last 10 messages)
      const contextMessages = conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the ask API with conversation history
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentText || question,
          country: country,
          language: "en",
          conversationHistory: contextMessages,
          isFollowUp: contextMessages.length > 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process question");
      }

      const data = await res.json();

      if (data.response) {
        // Add assistant response to conversation
        const assistantMessage: ConversationMessage = {
          id: `a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          content: data.response.summary || data.response._rawContent || "Response received",
          timestamp: new Date(),
          country,
          response: data.response,
        };

        setConversationHistory(prev => [...prev, assistantMessage]);
        setBureaucracyResponse(data.response);

        // Update suggested follow-ups based on procedure type
        const procedureName = data.response.procedureName?.toLowerCase() || '';
        if (procedureName.includes('visa')) {
          setSuggestedFollowUps([...defaultFollowUps.visa, ...defaultFollowUps.default]);
        } else if (procedureName.includes('permit')) {
          setSuggestedFollowUps([...defaultFollowUps.permit, ...defaultFollowUps.default]);
        } else {
          setSuggestedFollowUps(defaultFollowUps.default);
        }

        // Automatically switch to conversation view after first response
        if (!showConversation && conversationHistory.length > 0) {
          setShowConversation(true);
        }

        toast.success("Detailed answer ready", {
          id: loadingToast,
          description: `Information for ${countryName}: ${data.response.procedureName}`,
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Ask error:", err);
      setError("Failed to get answer. Please try again.");
      toast.error("Couldn't fetch the answer", {
        id: loadingToast,
        description: "Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // Auto-submit if a prefill came in via ?q=
  useEffect(() => {
    if (initialQ && !bureaucracyResponse && !documentAnalysis && !isLoading) {
      handleSubmit(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  const handleReset = () => {
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setError(null);
    setPrefill("");
    setNeedsMoreInfo(false);
    setConversationHistory([]);
    setShowConversation(false);
    setCurrentQuestionId(null);
  };

  const toggleConversation = () => {
    setShowConversation(prev => !prev);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ask FormWise</h1>
            <p className="text-muted-foreground">
              Ask any question about bureaucratic procedures and get detailed, source-backed guidance.
            </p>
          </div>
          {conversationHistory.length > 0 && (
            <Button
              variant={showConversation ? "default" : "outline"}
              size="sm"
              onClick={toggleConversation}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {showConversation ? "Hide History" : "Show History"}
              {conversationHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {conversationHistory.length}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Conversation History Panel */}
      <AnimatePresence>
        {showConversation && conversationHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="max-h-[500px] overflow-y-auto">
              <CardHeader className="pb-3 sticky top-0 bg-card z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Conversation History
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversationHistory.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {msg.role === 'user' ? 'You' : 'FormWise'}
                        </span>
                        <span className={`text-xs ${
                          msg.role === 'user' ? 'text-primary-foreground/50' : 'text-muted-foreground/50'
                        }`}>
                          {format(msg.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && msg.response && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {msg.response.officeInfo?.name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {msg.response.officeInfo.name}
                              </span>
                            )}
                            {msg.response.totalEstimatedTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {msg.response.totalEstimatedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={conversationEndRef} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AskInput
          key={prefill || 'fresh'}
          onSubmit={handleInputSubmit}
          isLoading={isLoading}
          initialValue={prefill}
          initialCountry={lastCountry}
          isFollowUp={showConversation && conversationHistory.length > 0}
        />
      </motion.div>

      {/* Suggestions - only show when no response */}
      <AnimatePresence>
        {!bureaucracyResponse && !documentAnalysis && !isLoading && !error && conversationHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              <span>Try asking about:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputSubmit(suggestion, undefined, lastCountry || "BG")}
                  className="text-sm"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-12">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Searching official sources...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    FormWise is compiling detailed guidance with legal references
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State - More Info Needed */}
      <AnimatePresence>
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
                <AlertCircle className="h-10 w-10 text-amber-600" />
                <div className="text-center max-w-md">
                  <p className="font-medium text-amber-800 dark:text-amber-200">{error}</p>
                  {needsMoreInfo && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Try including specific details like:
                      <ul className="mt-2 text-left list-disc list-inside text-xs">
                        <li>The exact type of procedure (e.g., "work permit" not just "work")</li>
                        <li>Your nationality or current status</li>
                        <li>Specific city or region if relevant</li>
                      </ul>
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={() => setNeedsMoreInfo(false)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Analysis Display */}
      <AnimatePresence>
        {documentAnalysis && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Separator />
            <DocumentAnalysisDisplay analysis={documentAnalysis} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bureaucracy Procedure Display */}
      <AnimatePresence>
        {bureaucracyResponse && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Separator />
            
            {/* Response meta info */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {getCountryName(lastCountry)}
                </Badge>
                {bureaucracyResponse._generatedAt && (
                  <span>
                    Last updated: {format(new Date(bureaucracyResponse._generatedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleConversation}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  View in Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Question
                </Button>
              </div>
            </div>

            <AnswerDisplay response={bureaucracyResponse} />

            {/* Suggested Follow-up Questions */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Follow-up Questions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ask a follow-up question to get more specific details
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {suggestedFollowUps.map((followUp, index) => (
                    <Button
                      key={`${followUp.category}-${index}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUp(followUp.question)}
                      disabled={isLoading}
                      className="text-left justify-start h-auto py-2 px-3"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-muted-foreground mb-1">{followUp.category}</span>
                        <span>{followUp.question}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function AskPage() {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground">Loading...</div>}
    >
      <AskPageInner />
    </Suspense>
  );
}
