# Browser Use Scraper Design

## Overview

Replace the Puppeteer-based scraper with Browser Use — a cloud browser automation API with built-in stealth/CAPTCHA bypass. The scraper uses Browser Use's Agent mode with natural language instructions and structured JSON output, validated by a second-pass OpenRouter call.

## Architecture

```
User clicks "Start scraping"
       ↓
/api/jobs/scrape
       ↓
Spawn: node scripts/scraper/browser-use-runner.ts
       ↓
Browser Use Agent:
  1. Receives natural language task + outputSchema
  2. Launches cloud browser (stealth/CAPTCHA handled)
  3. Navigates to job platform, paginates, extracts jobs
  4. Returns structured JSON matching outputSchema
       ↓
SSE Stream → Browser UI (progress via polling / stderr logs)
       ↓
AI Validation (OpenRouter) — kept as second-pass:
  - Validate extracted jobs have required fields
  - If FAIL → retry Browser Use once with corrected prompt
       ↓
Save to DB → return to UI
```

## Why Browser Use over Puppeteer

| Factor | Puppeteer | Browser Use |
|--------|-----------|-------------|
| Bot detection | Vulnerable (headless Chrome detected) | Built-in stealth + CAPTCHA bypass |
| CSS selectors | Manual, brittle | Natural language, adapts automatically |
| Setup complexity | Requires Chrome binary + stealth plugins | API key only, no browser setup |
| Maintenance | High (selectors break on site changes) | Low (agent navigates by semantics) |
| Cost | Free (self-hosted) | API credits (free tier available) |

## Components

### 1. Browser Use Runner Script
**File:** `scripts/scraper/browser-use-runner.ts`

Accepts CLI args: `--keyword`, `--platform`, `--max-pages`. Uses Browser Use SDK with `outputSchema` for structured extraction.

**Task prompt (Glints example):**
```
Go to https://glints.com/id/opportunities/jobs?query={keyword}
Scroll down or click "Load more" to load more job listings.
For each job listing visible, extract:
- title: the job title
- company: the company name
- location: the location text
- url: the link to the job detail page

Return a JSON object with a "jobs" array containing all extracted jobs.
```

**Key implementation:**
- `outputSchema` parameter ensures structured JSON output
- `maxCostUsd` limits spend per scrape
- `model` set to `gemini-3-flash` for speed (can upgrade to `claude-sonnet-4.6` for complex sites)
- stderr logs for SSE-ready progress events

### 2. Browser Use Client Wrapper
**File:** `src/lib/scraper/browser-use-client.ts`

Spawns the runner script as a child process, parses SSE-ready events from stderr.

### 3. AI Validator (Second Pass)
**File:** `scripts/scraper/ai-validator.ts`

Kept from Puppeteer implementation — validates extracted jobs have required fields. If validation fails, re-runs Browser Use with corrected instructions.

```ts
interface ValidationResult {
  valid: boolean;
  reason?: string;
}
```

**Validation rules:**
- Required fields: `title`, `company`, `url`
- If any job missing required fields → validation fails
- If ALL jobs missing required fields → retry Browser Use once with more specific prompt

### 4. SSE Progress Streaming
**File:** `src/app/api/jobs/scrape/route.ts`

Same SSE pattern as before — streams progress events to browser UI.

### 5. UI Progress Component
**File:** `src/components/scraper/scraper-progress.tsx`

Unchanged from Puppeteer implementation.

## Platform URLs

| Platform | Search URL | Pagination |
|----------|-----------|------------|
| Glints | `https://glints.com/id/opportunities/jobs?query={keyword}` | Load more button |
| Jobstreet | `https://www.jobstreet.com/id/jobs?keywords={keyword}` | Page numbers |
| LinkedIn | `https://www.linkedin.com/jobs/search?keywords={keyword}` | Load more / page numbers |

## Data Flow

### Normal Flow
1. User submits scrape request
2. SSE connection opens
3. Browser Use Agent launches → navigates → extracts → returns JSON
4. SSE sends progress events from stderr
5. AI validates extracted data
6. Save to DB → SSE sends done event

### Recovery Flow (validation fails)
1. Browser Use returns jobs → AI validation fails (missing fields)
2. Retry Browser Use with corrected prompt
3. Success → save to DB
4. Failure after retry → return error to UI

## Files to Create/Modify

### New files:
- `scripts/scraper/browser-use-runner.ts` — Browser Use SDK script (replaces puppeteer-runner.ts)

### Modified files:
- `src/lib/scraper/browser-use-client.ts` — new child_process wrapper (replaces puppeteer-wrapper.ts)
- `src/app/api/jobs/scrape/route.ts` — use browser-use-client instead of puppeteer-wrapper
- `docs/superpowers/specs/2026-04-12-puppeteer-scraper-design.md` → renamed/updated

### Deprecated (keep for reference):
- `scripts/scraper/puppeteer-runner.ts` — keep file, mark deprecated
- `scripts/scraper/selectors/config.ts` — no longer needed for scraping (kept for selector analysis reference)
- `scripts/scraper/selector-loader.ts` — no longer needed

### Removed:
- `scripts/scraper/debug-selectors.ts` — debug tool, no longer needed
- `scripts/scraper/test-dom.ts` — debug tool, no longer needed

## Dependencies

```bash
npm install browser-use-sdk
```

API key set via `BROWSER_USE_API_KEY` env var.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Browser Use API error | Return error, don't retry |
| Zero jobs extracted | AI validation fails → retry Browser Use once |
| AI API fails | Skip validation, use raw Browser Use data |
| Retry also fails | Return error with last error message |
| User cancels (SSE closes) | Process terminates via `process.kill()` |

## Testing Approach

1. **Unit test** `ai-validator.ts` — mock OpenRouter, test validation logic
2. **Integration test** — run against real Glints with Browser Use
3. **E2E test** — full flow with mocked browser (future)