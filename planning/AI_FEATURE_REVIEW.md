# AI Feature Review

> **Status: AUTHORITATIVE** — Revised under $0 constraint with Gemini Flash executability.

---

## Constraint Summary

- **Budget:** $0
- **API keys allowed:** Only user-provided, optional keys
- **Required behavior:** App must be 100% functional without any AI features
- **Tone:** AI is a helpful suggestion, never authoritative judgment

---

## Feature-by-Feature Verdict

### 1. Medium Detection — ❌ NOT IN MVP

| Aspect | Assessment |
|---|---|
| What it does | Suggests artistic medium (pencil, ink, watercolor) from image |
| Requires | Gemini API with vision capability |
| Free? | Gemini free tier exists but requires API key |
| MVP? | **No.** Manual selection from dropdown is sufficient and more reliable. |
| Accuracy | 70-80% — not good enough to justify the dependency |
| **Replacement** | Dropdown with presets: Pencil, Ink pen, Marker, Watercolor, Acrylic, Charcoal, Digital, Mixed, Other. User selects manually. |
| Post-MVP option | If user provides Gemini API key, pre-fill the dropdown with a suggestion. Always editable. |

### 2. Subject Tagging — ❌ NOT IN MVP

| Aspect | Assessment |
|---|---|
| What it does | Suggests tags like "bird", "portrait", "landscape" |
| Requires | Vision model or Cloud Vision Labels |
| Free? | Cloud Vision requires billing account (REJECTED). Gemini free tier possible. |
| MVP? | **No.** Manual tag entry is sufficient. Users know what they drew. |
| **Replacement** | Free-form tag input. No AI suggestions in MVP. |
| Post-MVP option | With user-provided Gemini key, suggest tags after upload. |

### 3. Style Tagging — ❌ POSTPONE INDEFINITELY

| Aspect | Assessment |
|---|---|
| What it does | Suggests "cross-hatching", "contour drawing", "pointillism" |
| Accuracy | 50-65% — unreliable |
| **Verdict** | Not worth implementing even post-MVP. Too unreliable to be useful. Manual tags serve this purpose. |

### 4. Tone/Mood Suggestions — ❌ POSTPONE INDEFINITELY

| Aspect | Assessment |
|---|---|
| What it does | Suggests "whimsical", "contemplative", "energetic" |
| Accuracy | 40-60% — highly subjective, likely to annoy users |
| **Verdict** | Remove from plan entirely. If users want to tag mood, they can type it themselves. An AI telling you your drawing feels "melancholic" when you meant it to be funny is worse than no suggestion. |

### 5. Artwork Description — ❌ NOT IN MVP

| Aspect | Assessment |
|---|---|
| What it does | Generates 2-3 sentence prose description |
| Accuracy | 75-85% — reasonable but may miss artist's intent |
| MVP? | **No.** Optional free-text description field serves this purpose. |
| Post-MVP option | With Gemini key, offer "Generate description" button. Always editable. |

### 6. Progress Comparison — ❌ POSTPONE INDEFINITELY

| Aspect | Assessment |
|---|---|
| What it does | Describes observable changes between two versions |
| Accuracy | 55-70% — may hallucinate changes |
| **Verdict** | Too unreliable. Users can write their own version notes. The side-by-side comparison view lets users see changes with their own eyes. |
| **Critical constraint** | Must NEVER assign skill scores or imply improvement/regression. |

### 7. Similarity Explanation — ❌ NOT IN MVP (mock exists)

| Aspect | Assessment |
|---|---|
| What it does | Explains why two artworks look similar |
| Current state | Already mocked with handwritten explanations in prototype |
| MVP? | **No.** Keep existing mock explanations. They're better than AI-generated ones because they're hand-crafted for the demo data. |
| Post-MVP option | With Gemini key, generate explanations for real search results. |

### 8. Creative Timeline Summaries — ✅ IN MVP (NO AI NEEDED)

| Aspect | Assessment |
|---|---|
| What it does | "This month you created 12 drawings, mostly in ink" |
| Requires | Simple aggregation of structured metadata |
| AI needed? | **No.** Template-based string generation from metadata counts. |
| **Implementation** | `src/utils/summaries.ts` — deterministic template function. |
| Example output | "You've added {count} drawings this month. Your most-used medium is {medium}. You've been most active on {dayOfWeek}s." |
| **Verdict** | ✅ Include in MVP. Zero external dependencies. |

### 9. Supplies Suggestions — ❌ POSTPONE INDEFINITELY

| Aspect | Assessment |
|---|---|
| What it does | Suggests art materials to try |
| **Verdict** | Remove. Low value. The supplies/materials feature itself is post-MVP. |

---

## Summary Decision Matrix

| Feature | MVP? | AI Required? | Free? | Decision |
|---|---|---|---|---|
| Medium detection | No | Yes | Conditional | Post-MVP with user key |
| Subject tagging | No | Yes | Conditional | Post-MVP with user key |
| Style tagging | No | Yes | Conditional | Remove from plan |
| Tone/mood | No | Yes | No | Remove from plan |
| Artwork description | No | Yes | Conditional | Post-MVP with user key |
| Progress comparison | No | Yes | Conditional | Remove from plan |
| Similarity explanation | No | Yes (or mock) | Mock is free | Keep mock in MVP |
| **Timeline summaries** | **Yes** | **No** | **Yes** | **Template-based, include in MVP** |
| Supplies suggestions | No | Optional | Optional | Remove from plan |

---

## Post-MVP AI Integration Architecture (If User Provides Gemini Key)

```typescript
// src/services/aiService.ts

interface AiService {
  isAvailable(): boolean;
  suggestMedium(imageBlob: Blob): Promise<string | null>;
  suggestTags(imageBlob: Blob): Promise<string[]>;
  generateDescription(imageBlob: Blob): Promise<string | null>;
}

// Implementation: 
// - Check localStorage for 'gemini-api-key'
// - If no key, all methods return null/empty
// - If key exists, call Gemini API with structured prompts
// - All results shown as "Suggested by AI" with edit/dismiss
// - Rate limit to 10 calls/minute client-side
// - Cache results per image hash
```

### Error Handling for AI Features

| Scenario | User Experience |
|---|---|
| No API key configured | AI suggestion buttons hidden. App works normally. |
| API key invalid | Show "API key error" once, disable AI until key is updated |
| Rate limited | Show "Suggestions temporarily unavailable" with retry timer |
| API returns garbage | Show "Couldn't generate suggestion" with manual input |
| API timeout (>10s) | Cancel request, show manual input |

### User Controls

- Settings page: "AI Suggestions" toggle (on/off)
- Settings page: "Gemini API Key" text input (optional)
- Per-suggestion: "Dismiss" button to remove suggestion
- Per-suggestion: Edit button to modify suggestion
- All AI-generated content marked with a small "✨ Suggested" label
