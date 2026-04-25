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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lightbulb, RotateCcw, AlertCircle, MessageCircle, ChevronRight, Clock, MapPin, History, RefreshCw, ShieldCheck, ClipboardList } from "lucide-react";
import type { BureaucracyResponse } from "@/lib/ai/schemas";
import { getCountryName } from "@/components/app/country-selector";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-context";
import { useQuestionHistory, validateQuestion, type QuestionHistoryItem } from "@/hooks/use-question-history";
import { useUserProcesses } from "@/hooks/use-user-data";

const TEMP_CHAT_STORAGE_KEY = "formwise-temporary-chat-enabled";

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
  temporary?: boolean;
}

// Suggested follow-up questions type
interface SuggestedFollowUp {
  question: string;
  category: string;
}

function AskPageInner() {
  const searchParams = useSearchParams();
  const { translate: tr, language } = useI18n();
  const initialQ = searchParams.get("q") ?? "";
  const historyId = searchParams.get("historyId");
  
  // Question history hook
  const { addQuestion, history } = useQuestionHistory();
  const { trackResponseAsProcess } = useUserProcesses();
  
  // State for loaded history item
  const [loadedHistoryItem, setLoadedHistoryItem] = useState<QuestionHistoryItem | null>(null);
  
  const suggestions = [
    tr("askPage.suggestions.s1"),
    tr("askPage.suggestions.s2"),
    tr("askPage.suggestions.s3"),
    tr("askPage.suggestions.s4"),
  ];
  const defaultFollowUps: Record<string, SuggestedFollowUp[]> = {
    default: [
      { question: tr("askPage.followUps.requirements"), category: tr("askPage.followUps.catRequirements") },
      { question: tr("askPage.followUps.timeline"), category: tr("askPage.followUps.catTimeline") },
      { question: tr("askPage.followUps.cost"), category: tr("askPage.followUps.catCosts") },
      { question: tr("askPage.followUps.location"), category: tr("askPage.followUps.catLocation") },
    ],
    visa: [
      { question: tr("askPage.followUps.visaWork"), category: tr("askPage.followUps.catWorkRights") },
      { question: tr("askPage.followUps.visaFamily"), category: tr("askPage.followUps.catFamily") },
      { question: tr("askPage.followUps.visaRejection"), category: tr("askPage.followUps.catRejection") },
    ],
    permit: [
      { question: tr("askPage.followUps.permitExtend"), category: tr("askPage.followUps.catExtension") },
      { question: tr("askPage.followUps.permitRenewal"), category: tr("askPage.followUps.catRenewal") },
      { question: tr("askPage.followUps.permitStatus"), category: tr("askPage.followUps.catStatusChange") },
    ],
  };
  const [isLoading, setIsLoading] = useState(false);
  const [bureaucracyResponse, setBureaucracyResponse] = useState<BureaucracyResponse & { _generatedAt?: string } | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentRiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCountry, setLastCountry] = useState<string>("BG");
  const [prefill, setPrefill] = useState<string>(initialQ);
  const [needsMoreInfo, setNeedsMoreInfo] = useState<boolean>(false);
  const [temporaryChat, setTemporaryChat] = useState(false);
  const [missingContextText, setMissingContextText] = useState("");
  const [missingContextDetails, setMissingContextDetails] = useState<{
    originalQuestion: string;
    response?: BureaucracyResponse;
    missingContext: string[];
    followUpQuestions: string[];
  } | null>(null);
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState("");
  const [trackedProcessIds, setTrackedProcessIds] = useState<string[]>([]);
  
  // Question validation state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>([]);

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

  useEffect(() => {
    const stored = localStorage.getItem(TEMP_CHAT_STORAGE_KEY);
    setTemporaryChat(stored === "true");
  }, []);

  const handleTemporaryChange = (checked: boolean) => {
    setTemporaryChat(checked);
    localStorage.setItem(TEMP_CHAT_STORAGE_KEY, String(checked));
    if (checked) {
      toast.info(tr("askPage.temporaryEnabled"), {
        description: tr("askPage.temporaryEnabledBody"),
      });
    }
  };

  // Load history item when historyId is provided
  useEffect(() => {
    if (historyId && history.length > 0) {
      const item = history.find(h => h.id === historyId);
      if (item) {
        setLoadedHistoryItem(item);
        setPrefill("");
        setLastCountry(item.country);
        setShowConversation(true);
        
        // Load the response
        if (item.response) {
          setBureaucracyResponse(item.response as BureaucracyResponse & { _generatedAt?: string });
        }
        
        // Add to conversation history
        const userMessage: ConversationMessage = {
          id: item.id,
          role: "user",
          content: item.fullQuestion,
          timestamp: new Date(item.timestamp),
          country: item.country,
          response: item.response as BureaucracyResponse,
        };
        const assistantMessage: ConversationMessage | null = item.response ? {
          id: `history-assistant-${item.id}`,
          role: "assistant",
          content: (item.response.summary as string | undefined) || (item.response._rawContent as string | undefined) || tr("askPage.responseReceived"),
          timestamp: new Date(item.timestamp + 1),
          country: item.country,
          response: item.response as BureaucracyResponse,
        } : null;
        setConversationHistory(assistantMessage ? [userMessage, assistantMessage] : [userMessage]);
        setLastSubmittedQuestion(item.fullQuestion);
        
        toast.info(tr("askPage.loadedFromHistory"), {
          description: tr("askPage.loadedFromHistoryBody"),
        });
      }
    }
  }, [historyId, history, tr]);

  const handleSubmit = async (question: string, file?: File, country?: string) => {
    // Validate that country is selected
    if (!country) {
      toast.error(tr("askPage.selectCountry"), {
        description: tr("askPage.selectCountryDescription"),
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastCountry(country);
    setLastSubmittedQuestion(question);
    setPrefill("");
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setMissingContextDetails(null);
    setMissingContextText("");
    setTrackedProcessIds([]);
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
    
    const loadingToast = toast.loading(tr("askPage.loadingFor", { country: countryName }), {
      description: tr("askPage.loadingDescription"),
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
          language,
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
        setError(tr("askPage.needSpecificInfo", { country: countryName }));
        toast.dismiss(loadingToast);
        toast.info(tr("askPage.detailPrompt"), {
          description: tr("askPage.moreInfoBody", { country: countryName }),
        });
        return;
      }

      // Check if it's document analysis response (has risk_level) or procedure response (has steps)
      if (data.risk_level) {
        // Document risk analysis response - save to localStorage
        addQuestion(documentText || question, data, country, language, true);
        setDocumentAnalysis(data);
        toast.success(tr("askPage.analysisComplete"), {
          id: loadingToast,
          description: tr("askPage.analysisDoneFor", { country: countryName }),
        });
      } else if (data.response) {
        // Bureaucracy procedure response (wrapped in response)
        setBureaucracyResponse(data.response);
        toast.success(tr("askPage.answerReady"), {
          id: loadingToast,
          description: tr("askPage.procedureInfoFor", { country: countryName }),
        });
      } else if (data.procedureName || data.steps) {
        // Direct procedure response
        setBureaucracyResponse(data);
        toast.success(tr("askPage.answerReady"), {
          id: loadingToast,
          description: tr("askPage.procedureInfoFor", { country: countryName }),
        });
      } else {
        // Unexpected response format
        setNeedsMoreInfo(true);
        setError(tr("askPage.missingSpecificInfo", { country: countryName }));
        toast.dismiss(loadingToast);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(tr("askPage.failedAnalyze"));
      toast.error(tr("askPage.failedAnswer"), {
        id: loadingToast,
        description: tr("askPage.checkConnection"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow-up question from suggestion
  const handleFollowUp = async (followUpQuestion: string) => {
    if (!lastCountry) {
      toast.error(tr("askPage.selectCountryFirst"));
      return;
    }
    setPrefill(followUpQuestion);
    await handleInputSubmit(followUpQuestion, undefined, lastCountry);
  };

  const handleMissingContextSubmit = async () => {
    if (!missingContextDetails || !missingContextText.trim()) return;

    const enrichedPrompt = [
      "Please continue and refine the previous procedure answer with the missing context below.",
      "",
      `Original question: ${missingContextDetails.originalQuestion}`,
      `Country: ${getCountryName(lastCountry)}`,
      `Language: ${language}`,
      "",
      "Previous answer summary:",
      missingContextDetails.response?.summary || missingContextDetails.response?._rawContent || "No structured summary available.",
      "",
      "Missing context requested:",
      [...missingContextDetails.missingContext, ...missingContextDetails.followUpQuestions].map((item) => `- ${item}`).join("\n") || "- None listed",
      "",
      "User-provided context:",
      missingContextText.trim(),
      "",
      "Return an updated, complete procedure answer using this extra context.",
    ].join("\n");

    const visiblePrompt = `${tr("askPage.contextSupplied")}\n${missingContextText.trim()}`;
    setMissingContextDetails(null);
    setMissingContextText("");
    await handleInputSubmit(enrichedPrompt, undefined, lastCountry, visiblePrompt);
  };

  // Handle submitting from input (with conversation context)
  const handleInputSubmit = async (question: string, file?: File, country?: string, displayQuestion?: string) => {
    if (!country) {
      toast.error(tr("askPage.selectCountry"), {
        description: tr("askPage.selectCountryDescription"),
      });
      return;
    }

    // Validate question before submitting
    const validation = validateQuestion(displayQuestion || question, country);
    if (!displayQuestion && !validation.isValid) {
      setValidationError(validation.missingInfo.join(" "));
      setValidationSuggestions(validation.suggestions);
      setError(validation.missingInfo[0] || "Please provide more details");
      setNeedsMoreInfo(true);
      
      toast.warning("Question needs more details", {
        description: validation.missingInfo[0] || "Please be more specific",
      });
      return;
    }
    
    // Clear validation state
    setValidationError(null);
    setValidationSuggestions([]);
    setNeedsMoreInfo(false);

    setIsLoading(true);
    setError(null);
    setLastCountry(country);
    setLastSubmittedQuestion(question);
    setPrefill("");
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setMissingContextDetails(null);
    setMissingContextText("");
    setTrackedProcessIds([]);

    // Generate unique ID for this question
    const questionId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentQuestionId(questionId);

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: questionId,
      role: "user",
      content: displayQuestion || question,
      timestamp: new Date(),
      country,
      temporary: temporaryChat,
    };

    setConversationHistory(prev => [...prev, userMessage]);
    setShowConversation(true);

    const countryName = getCountryName(country);
    
    const loadingToast = toast.loading(tr("askPage.searchingFor", { country: countryName }), {
      description: tr("askPage.providingGuidance"),
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
          language,
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
        const response = data.response as BureaucracyResponse;
        // Add assistant response to conversation
        const assistantMessage: ConversationMessage = {
          id: `a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          content: response.summary || response._rawContent || tr("askPage.responseReceived"),
          timestamp: new Date(),
          country,
          response,
          temporary: temporaryChat,
        };

        // Save to localStorage history
        addQuestion(question, response as unknown as Record<string, unknown>, country, language, false, { temporary: temporaryChat });

        setConversationHistory(prev => [...prev, assistantMessage]);
        setBureaucracyResponse(response);

        if (response.needsMoreContext || response.missingContext?.length || response.followUpQuestions?.length) {
          setNeedsMoreInfo(true);
          setMissingContextDetails({
            originalQuestion: question,
            response,
            missingContext: response.missingContext ?? [],
            followUpQuestions: response.followUpQuestions ?? [],
          });
        }

        // Update suggested follow-ups based on procedure type
        const procedureName = response.procedureName?.toLowerCase() || '';
        if (procedureName.includes('visa')) {
          setSuggestedFollowUps([...defaultFollowUps.visa, ...defaultFollowUps.default]);
        } else if (procedureName.includes('permit')) {
          setSuggestedFollowUps([...defaultFollowUps.permit, ...defaultFollowUps.default]);
        } else {
          setSuggestedFollowUps(defaultFollowUps.default);
        }

        toast.success(tr("askPage.detailedReady"), {
          id: loadingToast,
          description: tr("askPage.detailedInfoFor", {
            country: countryName,
            procedure: response.procedureName,
          }),
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Ask error:", err);
      setError(tr("askPage.failedAnswer"));
      toast.error(tr("askPage.failedAnswer"), {
        id: loadingToast,
        description: tr("askPage.checkConnection"),
      });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // Prefill if a question came in via ?q=. History restores the full conversation above.
  useEffect(() => {
    if (initialQ && !historyId) {
      setPrefill(initialQ);
    }
  }, [initialQ, historyId]);

  const handleReset = () => {
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setError(null);
    setPrefill("");
    setNeedsMoreInfo(false);
    setConversationHistory([]);
    setShowConversation(false);
    setCurrentQuestionId(null);
    setLoadedHistoryItem(null);
    setMissingContextDetails(null);
    setMissingContextText("");
    setLastSubmittedQuestion("");
    setTrackedProcessIds([]);
  };

  const toggleConversation = () => {
    setShowConversation(prev => !prev);
  };

  const handleTrackProcess = () => {
    if (!bureaucracyResponse || temporaryChat) return;
    const tracked = trackResponseAsProcess(lastSubmittedQuestion || bureaucracyResponse.procedureName, bureaucracyResponse, lastCountry);
    setTrackedProcessIds(prev => [...prev, tracked.id]);
    toast.success(tr("askPage.processTracked"), {
      description: tracked.name,
    });
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
            <h1 className="text-3xl font-bold tracking-tight">{tr("askPage.title")}</h1>
            <p className="text-muted-foreground">
              {tr("askPage.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm transition-colors ${
                temporaryChat
                  ? "border-amber-400/60 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-border bg-background/80 text-muted-foreground"
              }`}
              title={tr("askPage.temporaryChatDescription")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr("askPage.temporaryChatShort")}</span>
              <Switch checked={temporaryChat} onCheckedChange={handleTemporaryChange} className="scale-75" />
            </div>
            {conversationHistory.length > 0 && (
              <Button
                variant={showConversation ? "default" : "outline"}
                size="sm"
                onClick={toggleConversation}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {showConversation ? tr("askPage.hideHistory") : tr("askPage.showHistory")}
                {conversationHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {conversationHistory.length}
                  </Badge>
                )}
              </Button>
            )}
          </div>
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
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      {loadedHistoryItem ? tr("askPage.continuingFromHistory") : tr("askPage.historyTitle")}
                    </CardTitle>
                    {loadedHistoryItem && (
                      <Badge variant="outline" className="text-xs">
                        <History className="h-3 w-3 mr-1" />
                        {loadedHistoryItem.country}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {tr("common.clear")}
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
                          {msg.role === 'user' ? tr("askPage.you") : 'FormWise'}
                        </span>
                        <span className={`text-xs ${
                          msg.role === 'user' ? 'text-primary-foreground/50' : 'text-muted-foreground/50'
                        }`}>
                          {format(msg.timestamp, 'HH:mm')}
                        </span>
                        {msg.temporary && (
                          <Badge variant="outline" className="h-5 text-[10px]">
                            {tr("askPage.notSaved")}
                          </Badge>
                        )}
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
              <span>{tr("askPage.suggestionsLabel")}</span>
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
                  <p className="font-medium">{tr("askPage.searchingSources")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tr("askPage.compiling")}
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
                      {tr("askPage.moreInfoTips.intro")}
                      <ul className="mt-2 text-left list-disc list-inside text-xs">
                        <li>{tr("askPage.moreInfoTips.one")}</li>
                        <li>{tr("askPage.moreInfoTips.two")}</li>
                        <li>{tr("askPage.moreInfoTips.three")}</li>
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
                  {tr("common.tryAgain")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missing Context Continuation */}
      <AnimatePresence>
        {missingContextDetails && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  {tr("askPage.missingContextTitle")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {tr("askPage.missingContextBody")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {(missingContextDetails.missingContext.length > 0 || missingContextDetails.followUpQuestions.length > 0) && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {missingContextDetails.missingContext.length > 0 && (
                      <div className="rounded-lg border bg-background/70 p-3">
                        <p className="text-sm font-medium mb-2">{tr("askPage.missingFields")}</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {missingContextDetails.missingContext.map((item) => (
                            <li key={item}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {missingContextDetails.followUpQuestions.length > 0 && (
                      <div className="rounded-lg border bg-background/70 p-3">
                        <p className="text-sm font-medium mb-2">{tr("askPage.clarifyingQuestions")}</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {missingContextDetails.followUpQuestions.map((item) => (
                            <li key={item}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <Textarea
                  value={missingContextText}
                  onChange={(event) => setMissingContextText(event.target.value)}
                  placeholder={tr("askPage.contextPlaceholder")}
                  className="min-h-[110px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setMissingContextDetails(null)}>
                    {tr("common.close")}
                  </Button>
                  <Button onClick={handleMissingContextSubmit} disabled={!missingContextText.trim()} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {tr("askPage.sendWithContext")}
                  </Button>
                </div>
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
                    {tr("askPage.lastUpdated", {
                      date: format(new Date(bureaucracyResponse._generatedAt), 'MMM d, yyyy'),
                    })}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrackProcess}
                  disabled={temporaryChat || trackedProcessIds.length > 0}
                  className="gap-2"
                  title={temporaryChat ? tr("askPage.trackingDisabledTemporary") : undefined}
                >
                  <ClipboardList className="h-4 w-4" />
                  {trackedProcessIds.length > 0 ? tr("askPage.trackedProcess") : tr("askPage.trackProcess")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleConversation}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {tr("askPage.viewInChat")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {tr("askPage.newQuestion")}
                </Button>
              </div>
            </div>

            <AnswerDisplay response={bureaucracyResponse} />

            {/* Suggested Follow-up Questions */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  {tr("askPage.followUpTitle")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {tr("askPage.followUpSubtitle")}
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
