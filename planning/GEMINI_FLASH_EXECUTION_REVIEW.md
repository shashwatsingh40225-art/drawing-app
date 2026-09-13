# Gemini Flash Execution Review

> **Status: AUTHORITATIVE** — Produced by Gemini Flash Execution Reviewer.

---

## Assessment Summary

The original plan is well-structured but has several issues that would cause a Gemini Flash coding agent to stall, make incorrect assumptions, or silently diverge from the intended design.

---

## Critical Issues

### 1. 🔴 Phases 4-8 Are Underspecified

**Problem:** The playbook contains detailed task-level instructions only for Phases 1-3. Phases 4-8 are summarized in 2-3 bullet points each. A coding agent given "Build CalendarView component" without further specification would have to independently design the calendar layout, interaction model, data queries, and responsive behavior.

**Impact:** The agent would either produce a generic calendar component that doesn't match the design system, or stall requesting clarification.

**Resolution:** The revised plan limits the MVP to Phases 1-3 (with a streamlined Phase 3). Every task in the MVP is specified at implementation detail level. Post-MVP phases are documented as future scope only.

### 2. 🔴 Open Questions Left Unresolved

**Problem:** OPEN_QUESTIONS.md lists 7 unresolved questions (storage strategy, discovery approach, compression settings, deletion policy, navigation structure, collections vs. tags, calendar vs. timeline). The playbook instructs the agent to "check OPEN_QUESTIONS.md when in doubt" but the questions remain open.

**Impact:** The agent encounters an open question and must make an architectural decision it's not qualified to make, or it ignores the questions and picks whatever seems reasonable.

**Resolution:** All open questions are resolved with definitive decisions in DECISIONS_AND_ASSUMPTIONS.md. No question is left for the coding agent to decide.

### 3. 🟠 Ambiguous Component Extraction Strategy

**Problem:** Task 1.10 says "Extract reusable UI components" but doesn't specify exactly which inline styles to extract from which files, or whether the extracted components should replace the inline styles in existing screens immediately or later.

**Impact:** Agent may break existing screens by extracting styles incorrectly, or create components that don't match the existing visual appearance.

**Resolution:** Component extraction is specified with: (a) exact source screen, (b) exact lines/patterns to extract, (c) explicit instruction to not modify existing screens during extraction — only create the new components.

### 4. 🟠 Two Artwork Types Create Confusion

**Problem:** There's an existing `Artwork` interface in `src/data/artworks.ts` for discovery results, and a new `PersonalArtwork` interface for the sketchbook. The playbook says "Keep both, give them different names" but doesn't specify when/how they interact or merge.

**Impact:** Agent may confuse the two types, use the wrong one in components, or try to merge them prematurely.

**Resolution:** Rename clearly: `DiscoveryArtwork` (existing, read-only mock data) and `Artwork` (new, the primary entity). The two never share a component or store. Discovery screens use `DiscoveryArtwork`. Sketchbook screens use `Artwork`.

### 5. 🟠 Missing Error State Specifications

**Problem:** The screen state matrix lists error states for every screen but doesn't specify what errors can occur on each screen, what the error messages should say, or how to recover.

**Impact:** Agent implements generic "Something went wrong" for every error, or skips error handling entirely.

**Resolution:** Each task in the revised playbook includes specific error scenarios and messages.

### 6. 🟡 No Acceptance Criteria Per Task

**Problem:** Tasks end with "Verify:" but the verification steps are informal ("Upload 3+ artworks. View them in the gallery."). There are no automated test specifications.

**Impact:** Agent may consider a task "done" when it compiles without actually testing the behavior.

**Resolution:** Each task includes explicit acceptance criteria and a verification command.

---

## Tasks That Are Too Large

| Original Task | Lines of Instructions | Problem | Recommended Split |
|---|---|---|---|
| Task 1.9: Install React Router | 25 lines | Requires modifying App.tsx (175 lines), creating router, modifying 7 screens, and moving state — this is at least 4 separate tasks | Split into: (a) Create router.tsx, (b) Modify App.tsx to use RouterProvider, (c) Migrate Navigation to use Links, (d) Migrate each screen's callback props |
| Task 1.10: Extract Reusable Components | 35 lines | Creating 6 components in one task. Each component requires understanding the source pattern, creating the component, and testing it. | Split into one task per component |
| Task 2.6: Modify Home Screen | 15 lines | Requires conditional rendering, creating a "recent work" section with cards, and integrating with Zustand stores | Split into: (a) Add conditional rendering, (b) Create RecentWork section |

---

## Tasks That Require Too Much Product Judgment

| Task | Judgment Required | Resolution |
|---|---|---|
| "Build SketchbookScreen" | How should the gallery be laid out? What's the exact filter bar design? | Provide exact wireframe-level specification |
| "Build ArtworkEditScreen" | What form layout? What field order? What validation messages? | Specify exact field order, layout, and validation rules |
| "Build Collections feature" | How do collections appear in the UI? Modal or page? | Specify exact interaction pattern |
| "Modify Home Screen for dashboard" | What does "recent work" look like? How many cards? | Specify exact layout and card count |

---

## Missing Specifications the Agent Will Need

| Missing Item | Where It's Needed | Impact |
|---|---|---|
| Exact CSS class names for new components | Component extraction tasks | Agent invents class names that don't match design system |
| Import/export file format specification | Phase 3 data export | Agent designs an arbitrary format |
| IndexedDB schema version numbers | Database initialization | Agent doesn't handle schema upgrades |
| Image compression fallback behavior | Image service | Agent doesn't handle Web Worker failure |
| Exact filter options for gallery | SketchbookScreen | Agent makes up filter options |
| Maximum upload file size and error message | Upload flow | Agent may not validate file size |
| Soft delete implementation detail | Delete operations | Agent may implement hard delete |
| Tag normalization rules | Tag system | Agent may not normalize casing/whitespace |

---

## Recommended Playbook Structure

For each task, the revised playbook must include:

```markdown
### Task X.Y: [Name]

**Objective:** One-sentence description of what this task accomplishes.
**User-facing outcome:** What the user can do after this task is complete.
**Priority:** Must-have / Should-have / Nice-to-have
**Dependencies:** List of task IDs this depends on.

**Files to create or modify:**
- `src/path/to/file.ts` — [create/modify] — purpose

**Implementation steps:**
1. Exact step with code patterns
2. ...

**Data structures:**
```typescript
// Exact interface if relevant
```

**Validation rules:**
- Field X: required, max 100 chars
- Field Y: optional, ISO date format

**Error states:**
- If [condition]: show [message]
- If [condition]: show [message]

**Empty states:**
- If no data: show ART-01 with "[specific message]"

**Mobile behavior:**
- Below 640px: [specific layout change]

**Acceptance criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**How to verify:**
```bash
npm run dev
# Navigate to [URL]
# Perform [action]
# Expect [result]
```
```

---

## Execution Order Recommendation

The revised playbook should be executable as a strict sequence. The agent should never need to jump between phases or make decisions about what to do next.

Estimated total tasks for MVP: ~25-30 discrete tasks.
Estimated implementation time per task: 30-90 minutes.
Estimated total MVP implementation: 25-45 hours of coding agent time.
