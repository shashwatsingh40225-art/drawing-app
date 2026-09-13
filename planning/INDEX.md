# Kin — Planning Document Index

> **Updated:** September 12, 2026  
> **Status:** Review complete. Documents are execution-ready.

---

## 🟢 AUTHORITATIVE — Use These for Implementation

These documents are the **single source of truth** for the coding agent. If a document below conflicts with anything in the "archived" section, the authoritative document wins.

| # | Document | Purpose | Read Order |
|---|---|---|---|
| 1 | [UNIFIED_PLAYBOOK.md](./UNIFIED_PLAYBOOK.md) | **PRIMARY** — Task-by-task implementation instructions | Read first, follow sequentially |
| 2 | [DECISIONS_AND_ASSUMPTIONS.md](./DECISIONS_AND_ASSUMPTIONS.md) | Every design/tech decision, resolved | Reference when playbook says "See D-XX" |
| 3 | [DESIGN_INTEGRITY_GUIDELINES.md](./DESIGN_INTEGRITY_GUIDELINES.md) | Visual design rules and constraints | Read once before building any component |
| 4 | [UI_COMPONENT_INVENTORY.md](./UI_COMPONENT_INVENTORY.md) | Component specifications and hierarchy | Reference when building components |
| 5 | [FREE_TIER_AND_COST_AUDIT.md](./FREE_TIER_AND_COST_AUDIT.md) | Service budget and limits | Reference before adding any service |

---

## 🔵 REVIEW — Audit Trail

These documents record the reasoning behind the decisions. They are informational, not instructional. The coding agent does not need to read these.

| Document | Purpose |
|---|---|
| [DEPENDENCY_MINIMIZATION_REVIEW.md](./DEPENDENCY_MINIMIZATION_REVIEW.md) | Why each dependency was kept or removed |
| [SMALL_SCALE_ARCHITECTURE_REVIEW.md](./SMALL_SCALE_ARCHITECTURE_REVIEW.md) | Why the architecture is what it is |
| [GEMINI_FLASH_EXECUTION_REVIEW.md](./GEMINI_FLASH_EXECUTION_REVIEW.md) | Issues found in the original plan |
| [AI_FEATURE_REVIEW.md](./AI_FEATURE_REVIEW.md) | Why AI features are excluded from MVP |
| [ARTISTIC_DISCOVERY_REVIEW.md](./ARTISTIC_DISCOVERY_REVIEW.md) | Why discovery is mock-only in MVP |

---

## 🟡 ARCHIVED — Original Planning (Superseded)

These are the original planning documents. They contain valuable context and design intent but have been **superseded** by the authoritative documents above. Keep them for reference but do not follow them directly.

| Document | Status |
|---|---|
| [MASTER_IMPLEMENTATION_PLAN.md](./MASTER_IMPLEMENTATION_PLAN.md) | Superseded by UNIFIED_PLAYBOOK.md |
| [PRODUCT_SCOPE.md](./PRODUCT_SCOPE.md) | Superseded by DECISIONS_AND_ASSUMPTIONS.md |
| [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) | Superseded by SMALL_SCALE_ARCHITECTURE_REVIEW.md |
| [DATA_MODEL.md](./DATA_MODEL.md) | Superseded by schema in UNIFIED_PLAYBOOK.md Task 1.3 |
| [AI_FEATURE_FEASIBILITY.md](./AI_FEATURE_FEASIBILITY.md) | Superseded by AI_FEATURE_REVIEW.md |
| [ARTISTIC_DISCOVERY_ARCHITECTURE.md](./ARTISTIC_DISCOVERY_ARCHITECTURE.md) | Superseded by ARTISTIC_DISCOVERY_REVIEW.md |
| [GEMINI_IMPLEMENTATION_PLAYBOOK.md](./GEMINI_IMPLEMENTATION_PLAYBOOK.md) | Superseded by UNIFIED_PLAYBOOK.md |
| [RISK_REGISTER.md](./RISK_REGISTER.md) | Context only |
| [FEATURE_FEASIBILITY_MATRIX.md](./FEATURE_FEASIBILITY_MATRIX.md) | Superseded by DECISIONS_AND_ASSUMPTIONS.md |
| [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) | ALL RESOLVED in DECISIONS_AND_ASSUMPTIONS.md |
| [SCREEN_FLOW_MAP.md](./SCREEN_FLOW_MAP.md) | Context only |
| [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md) | Superseded by UNIFIED_PLAYBOOK.md |
| [CODEBASE_AUDIT.md](./CODEBASE_AUDIT.md) | Context only |

---

## Design Documents (Unchanged)

These are design source-of-truth documents. They remain valid and should be referenced for visual design decisions.

| Document | Purpose |
|---|---|
| [../design/DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) | Complete design language specification |
| [../design/ANTIGRAVITY_UI_SPEC.md](../design/ANTIGRAVITY_UI_SPEC.md) | Detailed UI specifications |
| [../design/ARTWORK_ASSET_MAP.md](../design/ARTWORK_ASSET_MAP.md) | Which artwork images to use where |
| [../design/VISUAL_REFERENCE.md](../design/VISUAL_REFERENCE.md) | Catalogue of the 20-drawing collection |

---

## Quick Start for the Coding Agent

1. Read **UNIFIED_PLAYBOOK.md** from top to bottom
2. Read **DESIGN_INTEGRITY_GUIDELINES.md** once
3. Start at **Task 1.1** and proceed sequentially
4. When you see "See D-XX", look it up in **DECISIONS_AND_ASSUMPTIONS.md**
5. **Never** make architectural decisions not covered in these documents
6. **Never** add features not listed in the playbook
7. If stuck, check the archived documents for context, but follow the authoritative ones
