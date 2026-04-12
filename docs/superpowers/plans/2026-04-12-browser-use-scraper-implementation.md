# Browser Use Scraper Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Puppeteer-based scraper with Browser Use — cloud browser automation with built-in stealth/CAPTCHA bypass and natural language task execution.

**Architecture:** Local Node script via child_process, spawning browser-use-runner.ts. Browser Use Agent runs in cloud with structured JSON output. Second-pass AI validation via OpenRouter. SSE progress streaming to browser.

**Tech Stack:** Browser Use SDK, OpenRouter API, SSE, Next.js API routes

---

## File Map

### New files:
- `scripts/scraper/browser-use-runner.ts` — Browser Use SDK script (CLI)
- `src/lib/scraper/browser-use-client.ts` — child_process spawn wrapper

### Modified files:
- `src/app/api/jobs/scrape/route.ts` — use browser-use-client instead of puppeteer-wrapper

### Deprecated (kept for reference):
- `scripts/scraper/puppeteer-runner.ts` — marked deprecated (Puppeteer approach failed due to bot detection)
- `scripts/scraper/selectors/config.ts` — no longer needed for scraping
- `scripts/scraper/selector-loader.ts` — no longer needed
- `scripts/scraper/debug-selectors.ts` — debug tool, no longer needed
- `scripts/scraper/test-dom.ts` — debug tool, no longer needed
- `src/lib/scraper/puppeteer-wrapper.ts` — replaced by browser-use-client

---

## Task 1: Install Browser Use SDK

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install browser-use-sdk in worktree**

```bash
cd .worktrees/browser-use
npm install browser-use-sdk
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add browser-use-sdk dependency"
```

---

## Task 2: Write Browser Use Runner Script

**Files:**
- Create: `scripts/scraper/browser-use-runner.ts`

- [ ] **Step 1: Write the Browser Use runner**

```ts
#!/usr/bin/env node

import { BrowserUse } from 'browser-use-sdk/v3';
import { validateJobs } from './ai-validator';
import type { PlatformName } from './selectors/config';

interface Job {
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description: string | null;
}

interface BrowserUseOutput {
  jobs: Array<{
    title: string;
    company: string;
    location: string;
    url: string;
  }>;
}

function log(type: string, data: Record<string, unknown>) {
  console.error(JSON.stringify({ type, ...data }));
}

function getPlatformUrl(platform: PlatformName, keyword: string): string {
  const encoded = encodeURIComponent(keyword);
  switch (platform) {
    case 'glints':
      return `https://glints.com/id/opportunities/jobs?query=${encoded}`;
    case 'jobstreet':
      return `https://www.jobstreet.com/id/jobs?keywords=${encoded}`;
    case 'linkedin':
      return `https://www.linkedin.com/jobs/search?keywords=${encoded}`;
    default:
      return `https://www.${platform}.com/jobs?search=${encoded}`;
  }
}

function buildTaskPrompt(platform: PlatformName, keyword: string, maxPages: number): string {
  const url = getPlatformUrl(platform, keyword);
  // Platform-specific natural language prompts for job extraction
  // ...
}

function parseOutput(rawOutput: unknown): BrowserUseOutput {
  // Parse JSON from Browser Use output (handles string or object)
}

async function runBrowserUse(
  platform: PlatformName,
  keyword: string,
  maxPages: number
): Promise<{ jobs: Job[]; success: boolean }> {
  const client = new BrowserUse({ apiKey: process.env.BROWSER_USE_API_KEY! });
  const result = await client.run(task, {
    model: 'gemini-3-flash',
    maxCostUsd: 0.5,
  });
  // Process result, parse JSON output, return jobs
}

async function scrapeWithRetry(
  platform: PlatformName,
  keyword: string,
  maxPages: number
): Promise<ScrapeResult> {
  // First attempt → AI validation → retry if failed
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scraper/browser-use-runner.ts
git commit -m "feat: add Browser Use runner script with AI validation"
```

---

## Task 3: Write Browser Use Client Wrapper

**Files:**
- Create: `src/lib/scraper/browser-use-client.ts`

- [ ] **Step 1: Write the client wrapper**

```ts
import { spawn } from 'node:child_process';
import path from 'node:path';

export async function* runBrowserUseScraper(
  options: ScraperOptions
): AsyncGenerator<ScraperProgress, void, unknown> {
  // Spawn node with browser-use-runner.ts
  // Parse stderr for progress events
  // Parse stdout for final JSON result
  // Yield progress events as they arrive
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scraper/browser-use-client.ts
git commit -m "feat: add Browser Use client wrapper"
```

---

## Task 4: Update Scrape API Route

**Files:**
- Modify: `src/app/api/jobs/scrape/route.ts`

- [ ] **Step 1: Replace puppeteer-wrapper with browser-use-client**

```ts
import { runBrowserUseScraper } from '@/lib/scraper/browser-use-client';

// Replace runPuppeteerScraper calls with runBrowserUseScraper
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/jobs/scrape/route.ts
git commit -m "feat: replace puppeteer with Browser Use scraper"
```

---

## Task 5: Add BROWSER_USE_API_KEY to .env.local

**Files:**
- Modify: `.env.local`

```bash
BROWSER_USE_API_KEY=bu_your_key_here
```

---

## Task 6: Mark Puppeteer Files as Deprecated

**Files:**
- Modify: `scripts/scraper/puppeteer-runner.ts`, `scripts/scraper/selectors/config.ts`, `scripts/scraper/selector-loader.ts`, `src/lib/scraper/puppeteer-wrapper.ts`

- [ ] **Step 1: Add deprecation header**

```ts
// DEPRECATED: This scraper used Puppeteer which was blocked by bot detection.
// Replaced by browser-use-runner.ts which uses Browser Use cloud browser automation.
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scraper/puppeteer-runner.ts scripts/scraper/selectors/config.ts scripts/scraper/selector-loader.ts src/lib/scraper/puppeteer-wrapper.ts
git commit -m "chore: mark puppeteer scraper as deprecated"
```

---

## Verification

After all tasks:

1. **Test scrape flow:** Upload CV → Generate keywords → Start scrape → Watch progress bar → Check jobs page for results

2. **Verify SSE:** Open browser DevTools → Network → filter by `/api/jobs/scrape` → should see SSE stream with progress events

3. **Test validation recovery:** If scraping returns invalid data, verify AI retry is triggered

---

## Notes

- Browser Use SDK uses `client.run(task, { schema, model, maxCostUsd })` for structured output
- Without schema, output is a string that needs JSON parsing
- The `ai-validator.ts` is kept as a second-pass validation layer
- `maxCostUsd: 0.5` limits spend per scrape to $0.50
- `model: 'gemini-3-flash'` is fast and cost-effective for job extraction