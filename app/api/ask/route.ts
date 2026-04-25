import { z } from 'zod';
import { runSirmaAgent } from '@/lib/sirma-agent';
import { getSirmaConfig, isSirmaConfigured } from '@/lib/sirma-config';
import { COUNTRY_NAMES } from '@/lib/types';
import { scrapeGovernmentInfo, formatGovernmentFallback, extractGovernmentOffice } from '@/lib/government-sources';

const askRequestSchema = z.object({
  text: z.string().trim().min(1),
  country: z.string().default('BG'),
  language: z.string().default('en'),
  documentContext: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe("Previous conversation for context in follow-up questions"),
  isFollowUp: z.boolean().optional().default(false).describe("Whether this is a follow-up to a previous question"),
});

export async function POST(req: Request) {
  try {
    const payload = askRequestSchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json(
        { error: 'Invalid request payload', details: payload.error.flatten() },
        { status: 400 }
      );
    }

    const { text, country, language, documentContext, conversationHistory, isFollowUp } = payload.data;

    if (!isSirmaConfigured()) {
      return Response.json(
        {
          error: 'Sirma not configured',
          details: 'SIRMA_AGENT_ID is missing',
        },
        { status: 500 }
      );
    }

    const config = getSirmaConfig();
    const countryName = COUNTRY_NAMES[country] || country;

    // Build the enhanced message with all required detail
    let message = '';

    if (isFollowUp && conversationHistory && conversationHistory.length > 0) {
      // Follow-up question format
      const previousQuestion = conversationHistory[conversationHistory.length - 2]?.content || 'Not available';
      const previousAnswer = conversationHistory[conversationHistory.length - 1]?.content || 'Not available';
      
      message = `[${language.toUpperCase()}] Country: ${countryName}

THIS IS A FOLLOW-UP QUESTION to a previous conversation.

PREVIOUS QUESTION: ${previousQuestion}

PREVIOUS ANSWER SUMMARY:
${previousAnswer.slice(0, 2000)}${previousAnswer.length > 2000 ? '...' : ''}

CURRENT FOLLOW-UP QUESTION: ${text}
${documentContext ? `\nContext from uploaded document:\n${documentContext}` : ''}

IMPORTANT: 
1. Reference the previous context when answering
2. Address the specific aspect the user is asking about
3. If clarifying the original answer, cite the specific part
4. If adding new information, cite official sources
5. If this question is outside the original scope, indicate this clearly
`;
    } else {
      // New question format with enhanced detail requirements
      message = `[${language.toUpperCase()}] Country: ${countryName}

User question: ${text}
${documentContext ? `\nContext from uploaded document:\n${documentContext}` : ''}

CRITICAL INSTRUCTIONS - Provide a COMPREHENSIVE, DETAILED response following this EXACT structure:

## REQUIRED RESPONSE FORMAT (JSON):

{
  "procedureName": "Official name of the procedure",
  "difficulty": "easy | moderate | complex",
  "totalEstimatedTime": "Total time (e.g., 2-4 weeks)",
  
  "summary": "Comprehensive 3-5 sentence summary of the procedure",
  "detailedSummary": "Extended summary covering key points and important considerations",
  
  "legalFoundation": {
    "lawName": "Specific law/regulation name",
    "article": "Article/section number if known",
    "year": "Year of law or last amendment",
    "url": "Official URL to the law if available",
    "lastVerified": "Date of last verification (e.g., 'April 2026')"
  },
  
  "eligibility": {
    "eligibleGroups": ["Who can apply (e.g., citizens, permanent residents)"],
    "prerequisites": ["Required conditions (e.g., residence permit, age requirement)"],
    "exceptions": ["Special cases if applicable"],
    "exclusions": ["Who should NOT use this procedure"]
  },

  "steps": [
    {
      "number": 1,
      "title": "Clear, actionable step title",
      "description": "EXACTLY what to do - be very specific and detailed",
      "estimatedTime": "Time for this step (e.g., '1-2 days')",
      "tips": "Practical tips to avoid common pitfalls",
      "officialSource": "URL to official instructions if available",
      "formReference": "Form number and name if applicable",
      "potentialIssues": ["Common issue 1", "Common issue 2"]
    }
  ],

  "requiredDocuments": [
    {
      "name": "Official document/form name",
      "description": "What this document is and why it's needed",
      "required": true,
      "whereToGet": "Where to obtain (office name, website, etc.)",
      "validityPeriod": "How long valid (e.g., '3 months', '1 year')",
      "requirements": ["Specific requirement 1", "Specific requirement 2"],
      "cost": "Cost (e.g., 'Free', '15 EUR')",
      "translationRequired": false,
      "legalBasis": "Law requiring this document"
    }
  ],

  "costs": {
    "governmentFees": "Official fees with basis (e.g., '50 EUR based on Article 25 of Law X')",
    "translationCosts": "Translation costs if required",
    "notarizationCosts": "Notarization costs if required",
    "otherCosts": [{"item": "Item name", "cost": "Cost"}],
    "paymentMethods": ["Accepted payment methods"],
    "totalEstimate": "Total estimated cost"
  },

  "timeline": {
    "minimumTime": "Minimum processing time",
    "maximumTime": "Maximum processing time if no issues",
    "factorsAffectingTimeline": ["Factor 1", "Factor 2"],
    "expeditedOptions": true,
    "expeditedTime": "Expedited time if available",
    "expeditedCost": "Additional cost for expedited",
    "afterApproval": "What happens after approval"
  },

  "officeInfo": {
    "name": "Official office/institution name",
    "address": "Complete physical address",
    "website": "Official website URL",
    "phone": "Phone number",
    "email": "Email if available",
    "hours": "Working hours (e.g., 'Mon-Fri 9:00-17:00')",
    "appointmentRequired": true,
    "languages": ["Languages of service"],
    "jurisdiction": "Area served"
  },

  "warnings": {
    "commonRejections": [{"reason": "Reason", "howToAvoid": "How to prevent"}],
    "scams": ["Known scams to avoid"],
    "whatNotToDo": ["Actions to avoid"]
  },

  "relatedProcedures": [
    {"name": "Related procedure name", "description": "How it relates", "order": "before | after | alternative"}
  ],

  "scope": {
    "covers": ["What this procedure covers"],
    "doesNotCover": ["What this procedure does NOT cover"]
  },

  "additionalNotes": "Any other important information"
}

## STRICT RULES:
1. NEVER fabricate information. If you don't know exact fees, hours, or forms, use "Check with official source" or "Varies by case"
2. Cite legal basis for all procedures and costs
3. Be EXHAUSTIVE in step descriptions - include every sub-step
4. Include practical tips based on common issues
5. Specify exact form numbers when known
6. Mention recent changes or reforms if relevant
7. Cover edge cases and variations

Return ONLY the JSON object. No markdown fences, no explanations before or after.`;

      // Add conversation history if present
      if (conversationHistory && conversationHistory.length > 0) {
        message += `\n\nConversation history for context:\n`;
        conversationHistory.forEach(msg => {
          message += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        message += `\nUse this context to provide consistent, informed answers.`;
      }
    }

    try {
      const result = await runSirmaAgent(config.agentId, message);

      // Parse JSON response
      let parsedResponse;
      let rawContent = result.content;

      try {
        // Clean up markdown and find JSON
        let jsonStr = result.content
          .replace(/^```json\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        parsedResponse = JSON.parse(jsonStr);
      } catch {
        // If JSON parsing fails, try to extract structured data from text
        parsedResponse = parseTextResponse(result.content, text);
        rawContent = result.content;
      }

      // Always include raw content for fallback display
      parsedResponse._rawContent = rawContent;
      if (result.sessionId) {
        parsedResponse._sessionId = result.sessionId;
      }

      // Add source attribution
      parsedResponse._country = countryName;
      parsedResponse._language = language;
      parsedResponse._generatedAt = new Date().toISOString();

      return Response.json({ response: parsedResponse });
    } catch (error) {
      console.error('Sirma ask error:', error);
      
      // Try web scraping fallback for government sources
      try {
        const { sources, scrapedContent, success } = await scrapeGovernmentInfo(
          country,
          text,
          { maxSources: 3 }
        );
        
        if (success && scrapedContent) {
          const fallbackContent = formatGovernmentFallback(text, scrapedContent, sources);
          return Response.json({
            response: {
              procedureName: `Information about: ${text.slice(0, 50)}`,
              difficulty: "moderate" as const,
              totalEstimatedTime: "Varies - check official sources",
              summary: `Information retrieved from official government sources for ${countryName}. Please verify with official authorities for exact requirements.`,
              detailedSummary: fallbackContent,
              legalFoundation: {
                lawName: "Official government sources",
                url: sources[0]?.baseUrl || "",
                lastVerified: new Date().toISOString().split('T')[0],
              },
              eligibility: {
                eligibleGroups: ["Check with official source"],
              },
              steps: [],
              requiredDocuments: [],
              costs: {
                governmentFees: "Varies - check official sources",
              },
              timeline: {
                minimumTime: "Varies",
                maximumTime: "Check with official source",
              },
              officeInfo: {
                name: sources[0]?.name || "Contact local authorities",
                address: "",
                website: sources[0]?.baseUrl || "",
                hours: "",
                appointmentRequired: false,
              },
              warnings: {
                commonRejections: [],
                scams: ["Beware of unofficial agents claiming to speed up processes"],
                whatNotToDo: ["Never pay fees to unofficial intermediaries"],
              },
              relatedProcedures: [],
              additionalNotes: fallbackContent,
              _rawContent: fallbackContent,
              _fallbackSource: "government_scrape",
              _country: countryName,
              _language: language,
              _generatedAt: new Date().toISOString(),
},
          });
        }
      } catch (scrapeError) {
        console.warn('Government scrape fallback also failed:', scrapeError);
      }
      
      return Response.json(
        {
          error: 'Failed to process question',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ask route error:', error);
    return Response.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}

/**
 * Parse unstructured text response into structured format
 */
function parseTextResponse(content: string, question: string) {
  const steps: Array<{ number: number; title: string; description: string; estimatedTime?: string; tips?: string }> = [];
  const lines = content.split('\n');
  let currentStep: { number: number; title: string; description: string; estimatedTime?: string; tips?: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match numbered steps like "1.", "1)", "- Step", "* Step"
    const stepMatch = trimmed.match(/^(?:(\d+)[\).]|[-*]\s*(?:Step\s*)?)(.+)/i);
    if (stepMatch) {
      if (currentStep) steps.push(currentStep);
      const number = stepMatch[1] ? parseInt(stepMatch[1]) : steps.length + 1;
      const title = stepMatch[2].trim();
      currentStep = { number, title, description: '' };
    } else if (currentStep && trimmed) {
      // Add to current step description
      currentStep.description += (currentStep.description ? ' ' : '') + trimmed;
    }
  }
  if (currentStep) steps.push(currentStep);

  // Extract office info
  let officeInfo = { 
    name: 'Contact local authorities', 
    address: '', 
    website: '', 
    phone: '',
    email: '',
    hours: '', 
    appointmentRequired: false,
    languages: [],
    jurisdiction: '',
  };
  const officeMatch = content.match(/(?:office|institution|authorities?)[:\s]+(.+)/i);
  if (officeMatch) {
    officeInfo.name = officeMatch[1].split('\n')[0].trim();
  }

  // Extract costs
  let costs: { governmentFees?: string; translationCosts?: string; notarizationCosts?: string; otherCosts?: Array<{item: string, cost: string}>; paymentMethods?: string[]; totalEstimate?: string } = {};
  const costMatch = content.match(/(?:cost|fee|price)[:\s]*[$€]?(.+?)(?:\n|$)/i);
  if (costMatch) {
    costs.governmentFees = costMatch[1].trim();
  } else if (content.toLowerCase().includes('free')) {
    costs.governmentFees = 'Free';
  }
  costs.paymentMethods = ['Check with office'];

  // Extract difficulty
  let difficulty: 'easy' | 'moderate' | 'complex' = 'moderate';
  const lower = content.toLowerCase();
  if (lower.includes('complex') || lower.includes('difficult')) difficulty = 'complex';
  else if (lower.includes('straightforward') || lower.includes('simple') || lower.includes('easy')) difficulty = 'easy';

  // Extract timeline info
  let timeline: { minimumTime?: string; maximumTime?: string; factorsAffectingTimeline?: string[]; expeditedOptions?: boolean; afterApproval?: string } = {};
  const timeMatch = content.match(/(?:time|duration|processing)[:\s]+(.+?)(?:\n|$)/i);
  if (timeMatch) {
    timeline.maximumTime = timeMatch[1].trim();
  }

  // Get first paragraph as summary
  const paragraphs = content.split('\n\n');
  const summary = paragraphs[0]?.slice(0, 500) || question;
  const detailedSummary = content.slice(0, 2000);

  return {
    procedureName: extractTitle(content) || question.slice(0, 50),
    difficulty,
    totalEstimatedTime: extractTime(content),
    summary,
    detailedSummary,
    legalFoundation: {
      lawName: 'Information from official sources - verify with authorities',
      lastVerified: new Date().toISOString().split('T')[0],
    },
    eligibility: {
      eligibleGroups: ['Check with official source for eligibility criteria'],
    },
    steps: steps.length > 0 ? steps : [{ number: 1, title: 'Follow the steps below', description: content }],
    requiredDocuments: [],
    costs,
    timeline,
    officeInfo,
    warnings: {
      commonRejections: [],
      scams: ['Beware of unofficial agents'],
      whatNotToDo: [],
    },
    relatedProcedures: [],
    scope: {
      covers: ['This procedure covers general bureaucratic guidance'],
      doesNotCover: ['Specific case-by-case determinations'],
    },
    additionalNotes: '',
  };
}

function extractTitle(content: string): string {
  // Look for markdown headers or bold text
  const headerMatch = content.match(/^#+\s*(.+)$/m);
  if (headerMatch) return headerMatch[1].trim();
  
  const boldMatch = content.match(/\*\*(.+?)\*\*/);
  if (boldMatch) return boldMatch[1].trim();
  
  return '';
}

function extractTime(content: string): string {
  const timePatterns = [
    /(\d+[\s\-]*\w+\s*(?:to|-)\s*\d+[\s\-]*\w+)/i,
    /(\d+\s*days?)/i,
    /(\d+\s*weeks?)/i,
    /(\d+\s*months?)/i,
    /(just\s*\d+[\s\-]*\w+)/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }
  
  return 'Varies - verify with official source';
}
