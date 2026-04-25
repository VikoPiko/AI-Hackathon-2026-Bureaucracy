"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AskInput } from "@/components/app/ask-input";
import { AnswerDisplay } from "@/components/app/answer-display";
import { DocumentAnalysisDisplay } from "@/components/app/document-analysis-display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, X, RotateCcw, AlertCircle } from "lucide-react";
import type { BureaucracyResponse } from "@/lib/ai/schemas";
import { getCountryName } from "@/components/app/country-selector";

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

const suggestions = [
  "How do I get a residence permit?",
  "What documents do I need to register a company?",
  "How to apply for a work visa?",
  "What is the process to renew my passport?",
];

function AskPageInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [bureaucracyResponse, setBureaucracyResponse] =
    useState<BureaucracyResponse | null>(null);
  const [documentAnalysis, setDocumentAnalysis] =
    useState<DocumentRiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string>("");
  const [lastCountry, setLastCountry] = useState<string>("BG");
  const [prefill, setPrefill] = useState<string>(initialQ);
  const [needsMoreInfo, setNeedsMoreInfo] = useState<boolean>(false);

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
    setLastQuestion(question);
    setLastCountry(country);
    setPrefill("");
    setBureaucracyResponse(null);
    setDocumentAnalysis(null);
    setNeedsMoreInfo(false);

    const countryName = getCountryName(country);
    
    const loadingToast = toast.loading(`Analyzing for ${countryName}...`, {
      description: "FormWise is searching the knowledge base.",
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

      // Call the analyze API with country
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
    setLastQuestion("");
    setPrefill("");
    setNeedsMoreInfo(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Ask FormWise</h1>
        <p className="text-muted-foreground">
          Ask any question about bureaucratic procedures and get step-by-step
          guidance. Select your country to get accurate information.
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AskInput
          key={prefill}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialValue={prefill}
          initialCountry={lastCountry}
        />
      </motion.div>

      {/* Suggestions - only show when no response */}
      <AnimatePresence>
        {!bureaucracyResponse && !documentAnalysis && !isLoading && !error && (
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
                  onClick={() => handleSubmit(suggestion, undefined, lastCountry)}
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
                  <p className="font-medium">Analyzing for {getCountryName(lastCountry)}...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Searching knowledge base and official sources
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Analysis for {getCountryName(lastCountry)}:{" "}
                <span className="font-medium text-foreground">
                  {lastQuestion}
                </span>
              </p>
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
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Results for {getCountryName(lastCountry)}:{" "}
                <span className="font-medium text-foreground">
                  {lastQuestion}
                </span>
              </p>
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
            <AnswerDisplay response={bureaucracyResponse} />
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
