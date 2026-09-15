/**
 * Gemini Flash AI Recap Service
 * Generates concise (~30 second) memory bridges grounded exclusively
 * in the exact text read during a single reading session.
 */

export interface GenerateRecapParams {
  bookTitle: string;
  author?: string;
  startPage: number;
  endPage: number;
  sessionText: string;
}

export interface RecapResult {
  success: boolean;
  recap?: string;
  error?: string;
  modelUsed?: string;
}

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-3.5-flash'];

let memoryApiKey: string | null = null;

export function getGeminiApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    const customKey = localStorage.getItem('kin_gemini_api_key') || localStorage.getItem('gemini-api-key');
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  } else if (memoryApiKey !== null) {
    return memoryApiKey;
  }

  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const envKey = metaEnv?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  const proc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  if (proc?.env?.VITE_GEMINI_API_KEY) {
    return proc.env.VITE_GEMINI_API_KEY.trim();
  }

  return memoryApiKey || '';
}

export function setGeminiApiKey(key: string): void {
  const trimmed = key.trim();
  if (typeof localStorage !== 'undefined') {
    if (trimmed) {
      localStorage.setItem('kin_gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('kin_gemini_api_key');
    }
  }
  memoryApiKey = trimmed;
}

/**
 * Builds the carefully constrained prompt for Gemini Flash.
 * Strictly adheres to grounding, incremental range bounds, spoiler prevention, and 30-second brevity.
 */
export function buildRecapPrompt(params: GenerateRecapParams): string {
  const { bookTitle, author, startPage, endPage, sessionText } = params;

  return `You are a Reading Session Memory Bridge assistant for a reader resuming their book.

YOUR MISSION:
The reader just returned to this book after a previous reading session. Create a short, high-fidelity "Previously..." memory bridge summarizing ONLY what happened during Pages ${startPage} through ${endPage}.
Target reading time: 30 seconds (~70 to 120 words).

STRICT GROUNDING & SPOILER RULES:
1. GROUNDING: Use ONLY the text provided below from Pages ${startPage}–${endPage}. Do NOT use prior knowledge of this book, do NOT speculate, and do NOT extrapolate.
2. NO SPOILERS: Summarize ONLY up to Page ${endPage}. Do NOT mention anything that occurs after Page ${endPage}.
3. SELECTIVITY: Do NOT mechanically summarize every paragraph. Focus on what actually matters for resuming reading:
   - What key event, turning point, or revelation occurred?
   - What core concepts, definitions, or arguments were established?
   - Where did this session leave off?
4. STYLE & TONE:
   - For narrative/fiction: focus on character shifts, conflicts, and where the story stands right now.
   - For nonfiction/technical: focus on key concepts, relationships between ideas, and takeaways.
   - Format: Either a crisp 2-paragraph memory bridge OR 3–4 punchy bullet points followed by "Where you left off: [brief sentence]".
   - Never use filler phrases like "In this session the author discusses" or "This chapter is about". Start directly with the substance.
   - Do NOT impersonate the author or reproduce copyrighted prose.

BOOK CONTEXT:
Title: "${bookTitle}"
${author ? `Author: "${author}"` : ''}
Session Reading Range: Pages ${startPage} to ${endPage}

EXACT SESSION CONTENT (PAGES ${startPage}–${endPage}):
"""
${sessionText}
"""

Produce the 30-second Memory Bridge now:`;
}

/**
 * Calls the Google Gemini API with fallback across Flash models.
 */
async function callGeminiApi(apiKey: string, prompt: string): Promise<{ text: string; model: string }> {
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 350,
            topP: 0.85,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new Error('Gemini API rate limit or quota exceeded. Please try again shortly.');
      }

      if (response.status === 403) {
        const errJson = await response.json().catch(() => null);
        const detail = errJson?.error?.message || 'Access denied';
        throw new Error(`Gemini API permission denied: ${detail}. You can configure a valid API key in settings.`);
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${response.status} from Gemini API`;
        // If 404 model not found, try next fallback model
        if (response.status === 404) {
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText || !generatedText.trim()) {
        throw new Error('Gemini returned an empty response.');
      }

      return {
        text: generatedText.trim(),
        model,
      };
    } catch (err: any) {
      lastError = err;
      if (err.name === 'AbortError') {
        lastError = new Error('Gemini API request timed out (20s).');
      }
      // Continue to next model only on model-specific errors
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        continue;
      }
      // For general errors or timeouts, don't cascade fruitlessly
      break;
    }
  }

  throw lastError || new Error('Could not generate recap with Gemini.');
}

/**
 * Generates an AI Reading Session Recap for a specific page range.
 * Never throws — returns a structured RecapResult.
 */
export async function generateSessionRecap(params: GenerateRecapParams): Promise<RecapResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.includes('placeholder')) {
    return {
      success: false,
      error: 'Gemini API key is not configured. Set VITE_GEMINI_API_KEY or configure an API key to enable AI recaps.',
    };
  }

  if (!params.sessionText || params.sessionText.trim().length < 20) {
    return {
      success: false,
      error: 'Insufficient text extracted from this reading session to generate a recap.',
    };
  }

  try {
    const prompt = buildRecapPrompt(params);
    const { text, model } = await callGeminiApi(apiKey, prompt);

    return {
      success: true,
      recap: text,
      modelUsed: model,
    };
  } catch (err: any) {
    console.warn('Failed to generate session recap:', err.message);
    return {
      success: false,
      error: err.message || 'Unable to generate AI reading recap.',
    };
  }
}
