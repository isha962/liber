# Premium Shell Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Liber's app shell into a polished premium reading experience without changing session logic, PDF persistence, data flow, or share export behavior.

**Architecture:** Apply a UI-only polish pass centered on shared design tokens, typography, surface treatments, and component-level styling updates. Preserve current information architecture and behavior while improving shell cohesion across Home, Books, Session, PDF Reader, and Share wrapper screens.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, next/font/google, existing React component structure.

---

### Task 1: Shared visual system

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] Add warm design tokens, texture/background utilities, and reusable shell classes.
- [ ] Import premium heading/body fonts with `next/font/google` and apply them via body classes/CSS vars.
- [ ] Keep global changes UI-only with no logic changes.

### Task 2: Shell and navigation polish

**Files:**
- Modify: `components/LiberApp.tsx`
- Modify: `components/BottomNav.tsx`
- Modify: `components/ActivityStatsCard.tsx`

- [ ] Upgrade the mobile shell, section rhythm, CTA styling, and surface treatments.
- [ ] Convert bottom nav into a polished floating pill with icons and stronger active state.
- [ ] Keep padding-bottom safe for mobile navigation and existing flows.

### Task 3: Books and session surface polish

**Files:**
- Modify: `components/BookForm.tsx`
- Modify: `components/ActiveSessionTimer.tsx`
- Modify: `components/SessionSummary.tsx`
- Modify: `components/LiberApp.tsx`

- [ ] Refine book list cards, upload area, and add-book form styling.
- [ ] Upgrade active session, end-session steppers, and history card presentation.
- [ ] Keep all controls and current behavior unchanged beyond visuals.

### Task 4: PDF reader and share wrapper polish

**Files:**
- Modify: `components/PdfReader.tsx`
- Modify: `components/LiberApp.tsx`

- [ ] Make the PDF reader feel more immersive in both normal and fullscreen modes.
- [ ] Improve share wrapper preview frame, variant toggle, and action buttons while leaving the exported story template unchanged.
- [ ] Preserve the existing preview/export data flow.

### Task 5: Verification

**Files:**
- Test: `tests/liber-app.test.tsx`
- Test: full suite

- [ ] Run `npm test` and confirm all current behavior still passes.
- [ ] Run `npm run build` and confirm production build succeeds.
