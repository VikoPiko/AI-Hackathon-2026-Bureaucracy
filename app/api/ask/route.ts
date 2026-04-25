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

    const { text, country, language, documentContext } = payload.data;

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

    const message = `[${language.toUpperCase()}] Country: ${countryName}

User question: ${text}${documentContext ? `\n\nContext from uploaded document:\n${documentContext}` : ''}

IMPORTANT: Provide a structured response about this bureaucratic procedure.

Format your response as a valid JSON object with this EXACT structure:
{
  "procedureName": "Official name of the procedure",
  "difficulty": "easy" | "moderate" | "complex",
  "totalEstimatedTime": "e.g., 2-4 weeks",
  "summary": "A clear 2-3 sentence summary",
  "steps": [
    {
      "number": 1,
      "title": "Step title",
      "description": "Detailed description of what to do",
      "estimatedTime": "e.g., 1-2 days",
      "tips": "Helpful tips if any"
    }
  ],
  "requiredDocuments": [
    {
      "name": "Document name",
      "description": "What this document is",
      "required": true,
      "whereToGet": "Where to obtain it"
    }
  ],
  "officeInfo": {
    "name": "Office/institution name",
    "address": "Address if known",
    "website": "Website URL if known",
    "hours": "Working hours",
    "appointmentRequired": true
  },
  "costs": "Estimated costs or 'Free'",
  "additionalNotes": "Important warnings or tips"
}

Return ONLY the JSON object. No markdown fences, no explanations before or after.`;

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
        rawContent = result.content; // Keep full text
      }

      // Always include raw content for fallback display
      parsedResponse._rawContent = rawContent;
      if (result.sessionId) {
        parsedResponse._sessionId = result.sessionId;
      }

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
              summary: `Information retrieved from official government sources for ${countryName}.`,
              steps: [],
              requiredDocuments: [],
              officeInfo: {
                name: sources[0]?.name || "Contact local authorities",
                address: "",
                website: sources[0]?.baseUrl || "",
                hours: "",
                appointmentRequired: false,
              },
              costs: "Varies by case",
              additionalNotes: fallbackContent,
              _rawContent: fallbackContent,
              _fallbackSource: "government_scrape",
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
  const steps: Array<{ number: number; title: string; description: string }> = [];
  const lines = content.split('\n');
  let currentStep: { number: number; title: string; description: string } | null = null;

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
  let officeInfo = { name: 'Contact local authorities', address: '', website: '', hours: '', appointmentRequired: false };
  const officeMatch = content.match(/(?:office|institution|authorities?)[:\s]+(.+)/i);
  if (officeMatch) {
    officeInfo.name = officeMatch[1].split('\n')[0].trim();
  }

  // Extract costs
  let costs = 'Varies by case';
  const costMatch = content.match(/(?:cost|fee|price)[:\s]*[$€]?(.+?)(?:\n|$)/i);
  if (costMatch) {
    costs = costMatch[1].trim();
  } else if (content.toLowerCase().includes('free')) {
    costs = 'Free';
  }

  // Extract difficulty
  let difficulty: 'easy' | 'moderate' | 'complex' = 'moderate';
  const lower = content.toLowerCase();
  if (lower.includes('complex') || lower.includes('difficult')) difficulty = 'complex';
  else if (lower.includes('straightforward') || lower.includes('simple') || lower.includes('easy')) difficulty = 'easy';

  // Get first paragraph as summary
  const paragraphs = content.split('\n\n');
  const summary = paragraphs[0]?.slice(0, 500) || question;

  return {
    procedureName: extractTitle(content) || question.slice(0, 50),
    difficulty,
    totalEstimatedTime: extractTime(content),
    summary,
    steps: steps.length > 0 ? steps : [{ number: 1, title: 'Follow the steps below', description: content }],
    requiredDocuments: [],
    officeInfo,
    costs,
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
  
  return 'Varies';
}
