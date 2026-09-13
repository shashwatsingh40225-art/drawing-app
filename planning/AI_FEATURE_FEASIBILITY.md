# AI Feature Feasibility

## Assessment Framework

Each feature is classified by:
- **Difficulty:** Easy / Moderate / Difficult / Not reliable enough for MVP
- **Required capability:** What model/API is needed
- **Free alternative:** Whether it can be done without paid AI
- **Mockability:** Whether it can be mocked convincingly
- **User editability:** How users can correct AI suggestions

---

## Feature Assessments

### 1. Medium Detection

**Task:** Given an artwork image, suggest the artistic medium (pencil, ink pen, marker, watercolor, acrylic, digital, etc.)

| Aspect | Assessment |
|---|---|
| Difficulty | Moderate |
| Required capability | Vision model (Gemini 2.0 Flash) |
| Input | Image blob |
| Output | `{ medium: string, confidence: number }` |
| Structured JSON needed | Yes |
| Free alternative | Manual entry (primary); AI suggestion as enhancement |
| Mockability | Easy — return "Pencil on paper" for all |
| Expected accuracy | 70-80% for common media; lower for mixed media |
| Failure cases | Mixed media (ink + watercolor), digital mimicking traditional, unusual materials |
| User editability | Dropdown with free-text override; AI suggestion shown as pre-filled but editable |
| MVP recommendation | **Mock** — use manual selection with common presets |

### 2. Subject Tagging

**Task:** Suggest descriptive tags for an artwork's subject (e.g., "bird", "portrait", "landscape", "abstract")

| Aspect | Assessment |
|---|---|
| Difficulty | Easy |
| Required capability | Vision model or Cloud Vision Label Detection |
| Input | Image blob |
| Output | `string[]` (3-8 tags) |
| Structured JSON needed | Yes |
| Free alternative | Google Cloud Vision Labels (1,000 free/month); manual entry |
| Mockability | Easy — return generic tags |
| Expected accuracy | High (85%+) for common subjects |
| Failure cases | Abstract art, highly stylized/hybrid creatures, unusual subjects |
| User editability | Tag chips — add/remove freely, AI suggestions shown as "suggested" |
| MVP recommendation | **Mock** — manual tags only; add Vision Labels in v1.1 |

### 3. Style Tagging

**Task:** Suggest artistic style tags (e.g., "cross-hatching", "gestural", "contour drawing", "pointillism")

| Aspect | Assessment |
|---|---|
| Difficulty | Moderate |
| Required capability | Vision model with art knowledge (Gemini) |
| Input | Image blob |
| Output | `string[]` (2-5 style tags) |
| Structured JSON needed | Yes |
| Free alternative | None reliable — generic vision models don't understand art technique vocabulary |
| Mockability | Easy — return from preset list |
| Expected accuracy | 50-65% — models recognize broad styles but not nuanced technique |
| Failure cases | Subtle technique differences, regional styles, mixed techniques |
| User editability | Same as subject tags |
| MVP recommendation | **Postpone** — unreliable, low user value relative to effort |

### 4. Tone/Vibe/Mood Suggestions

**Task:** Suggest mood descriptors (e.g., "whimsical", "melancholic", "energetic", "contemplative")

| Aspect | Assessment |
|---|---|
| Difficulty | Moderate |
| Required capability | Vision model (Gemini) |
| Input | Image blob |
| Output | `string[]` (1-3 mood descriptors) |
| Structured JSON needed | Yes |
| Free alternative | None |
| Mockability | Easy — return "Whimsical" for everything |
| Expected accuracy | 40-60% — highly subjective, model may disagree with artist's intent |
| Failure cases | Ironic art, ambiguous mood, cultural differences in interpretation |
| User editability | Optional field, always editable |
| MVP recommendation | **Not reliable enough for MVP** — too subjective |

### 5. Artwork Description

**Task:** Generate a short prose description of an artwork (2-3 sentences)

| Aspect | Assessment |
|---|---|
| Difficulty | Easy |
| Required capability | Vision model (Gemini) |
| Input | Image blob |
| Output | `string` (50-150 words) |
| Structured JSON needed | No |
| Free alternative | Manual entry |
| Mockability | Easy — use placeholder text |
| Expected accuracy | 75-85% — descriptions will be reasonable but may miss artist intent |
| Failure cases | Abstract work, highly personal symbolism, inside jokes in the art |
| User editability | Full text editing |
| MVP recommendation | **Mock** — add as v2 enhancement |

### 6. Progress Comparison (Version Difference Description)

**Task:** Given two versions of a drawing, describe observable changes

| Aspect | Assessment |
|---|---|
| Difficulty | Difficult |
| Required capability | Vision model comparing two images (Gemini multimodal) |
| Input | Two image blobs |
| Output | `{ changes: string[], overallAssessment: string }` |
| Structured JSON needed | Yes |
| Free alternative | None |
| Mockability | Moderate — would need paired mock images |
| Expected accuracy | 55-70% — can detect major changes but may miss subtle ones or hallucinate |
| Failure cases | Subtle shading changes, small detail additions, color temperature shifts |
| User editability | Full text editing of each observation |
| MVP recommendation | **Not reliable enough for MVP** — add in v2 with user-editable override |

**CRITICAL CONSTRAINT:** Must never assign numerical scores to artistic progress or imply skill improvement. Describe **observable changes only** (e.g., "Additional cross-hatching in the background area" not "Improved technique").

### 7. Similarity Explanation

**Task:** Explain why two artworks look artistically similar

| Aspect | Assessment |
|---|---|
| Difficulty | Moderate |
| Required capability | Vision model (Gemini multimodal) |
| Input | Two image blobs |
| Output | `string` (1-3 sentences) |
| Structured JSON needed | No |
| Free alternative | None |
| Mockability | Easy — already mocked in prototype with handwritten explanations |
| Expected accuracy | 65-80% — models can identify broad similarities |
| Failure cases | Abstract similarity, technical nuances, stylistic influence vs. visual similarity |
| User editability | Full text editing |
| MVP recommendation | **Mock** with existing handwritten explanations; add real AI in v1.2 |

### 8. Creative Timeline Summaries

**Task:** Generate a summary of the user's creative activity over a period (e.g., "This month you created 12 drawings, mostly in ink, with a focus on bird subjects")

| Aspect | Assessment |
|---|---|
| Difficulty | Easy (if metadata exists) |
| Required capability | Language model (Gemini text) or simple code aggregation |
| Input | Artwork metadata records |
| Output | `string` (2-5 sentences) |
| Structured JSON needed | No |
| Free alternative | Template-based aggregation (no AI needed) |
| Mockability | Easy |
| Expected accuracy | High (90%+) if based on structured metadata; lower if inferring from images |
| Failure cases | Insufficient data (fewer than 5 artworks) |
| User editability | Not needed (it's a factual summary) |
| MVP recommendation | **Build as template-based** (no AI) — "You created X drawings this month. Your most-used medium was Y." |

### 9. Supplies Suggestions

**Task:** Based on artwork metadata, suggest materials the user might want to try

| Aspect | Assessment |
|---|---|
| Difficulty | Easy (with LLM) |
| Required capability | Language model |
| Input | List of mediums/materials already used |
| Output | `{ suggestion: string, reason: string }[]` |
| Structured JSON needed | Yes |
| Free alternative | Hardcoded suggestion rules |
| Mockability | Easy |
| Expected accuracy | Medium — suggestions may not be relevant to user's interests |
| Failure cases | Suggesting expensive materials, materials requiring skill the user doesn't have |
| User editability | Dismiss/hide suggestions |
| MVP recommendation | **Postpone** — low priority, hardcoded tips are sufficient |

---

## Summary Matrix

| Feature | Difficulty | MVP? | Free? | Reliable? | Mock First? |
|---|---|---|---|---|---|
| Medium detection | Moderate | No | Yes (Gemini free) | 70-80% | Yes |
| Subject tagging | Easy | No | Yes (Vision free) | 85%+ | Yes |
| Style tagging | Moderate | No | No | 50-65% | Yes |
| Tone/mood | Moderate | No | No | 40-60% | Skip |
| Artwork description | Easy | No | Yes (Gemini free) | 75-85% | Yes |
| Progress comparison | Difficult | No | Yes (Gemini free) | 55-70% | Skip |
| Similarity explanation | Moderate | No | Yes (Gemini free) | 65-80% | Yes (existing) |
| Timeline summaries | Easy | Yes | Yes (no AI needed) | 90%+ | Build as template |
| Supplies suggestions | Easy | No | Yes (hardcoded) | Medium | Skip |

---

## Gemini API Usage Plan

**Model:** Gemini 2.0 Flash (free tier)
**Limits:** 15 requests/minute, 1,500 requests/day, 1M tokens/day
**Sufficient for:** A single user generating 20-30 AI suggestions per day

### Prompt Templates (for future implementation)

All prompts should:
1. Request structured JSON output
2. Include explicit instruction to avoid skill judgments
3. Limit response length to reduce token usage
4. Include a system message explaining the app's purpose

### Error Handling

- If API fails: show "Suggestion unavailable" with manual entry
- If rate limited: queue requests, prioritize user-initiated over background
- If response is malformed: fall back to empty suggestions
- Always allow user to dismiss or edit AI output
