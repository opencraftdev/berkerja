# Puppeteer Scraper Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder shell scripts with real Puppeteer scrapers that extract job listings, with AI validation and auto-updating selectors.

**Architecture:** Local Node script via child_process, spawning puppeteer-runner.ts. SSE progress streaming to browser. Hybrid selectors (pre-seeded + AI auto-update on validation failure).

**Tech Stack:** Puppeteer, OpenRouter API, SSE, Next.js API routes

---

## File Map

### New files:
- `scripts/scraper/selectors/config.ts` — pre-seeded selectors per platform
- `scripts/scraper/ai-validator.ts` — OpenRouter validation + re-extraction
- `scripts/scraper/selector-loader.ts` — loads/merges selectors
- `scripts/scraper/puppeteer-runner.ts` — main Puppeteer script (CLI)
- `src/lib/scraper/puppeteer-wrapper.ts` — child_process spawn wrapper
- `src/hooks/use-scraper-sse.ts` — SSE hook for browser
- `src/components/scraper/scraper-progress.tsx` — UI progress component

### Modified files:
- `src/app/api/jobs/scrape/route.ts` — spawn puppeteer instead of shell script, SSE support
- `src/app/(dashboard)/keywords/page.tsx` — wire ScraperProgress
- `src/app/(dashboard)/jobs/page.tsx` — wire ScraperProgress
- `scripts/glints-scraper.sh` — mark as deprecated (comment header)
- `scripts/jobstreet-scraper.sh` — mark as deprecated
- `scripts/linkedin-scraper.sh` — mark as deprecated

---

## Task 1: Install Puppeteer + Create Directory Structure

**Files:**
- Create: `scripts/scraper/` (directory)
- Create: `scripts/scraper/selectors/` (directory)

- [ ] **Step 1: Install puppeteer in worktree**

```bash
cd .worktrees/berkerja-puppeteer
npm install puppeteer
npm install -D @types/puppeteer
```

- [ ] **Step 2: Commit**

```bash
cd .worktrees/berkerja-puppeteer
git add package.json package-lock.json
git commit -m "chore: add puppeteer dependency"
```

---

## Task 2: Pre-seeded Selector Config

**Files:**
- Create: `scripts/scraper/selectors/config.ts`

- [ ] **Step 1: Write the selector config**

```ts
export interface PlatformSelector {
  url: string;
  searchParam: string;
  pagination: 'load-more' | 'page-number';
  selectors: {
    jobList: string;
    title: string;
    company: string;
    location: string;
    url: string; // can include @attribute syntax
  };
}

export type PlatformName = 'glints' | 'jobstreet' | 'linkedin';

export const platformSelectors: Record<PlatformName, PlatformSelector> = {
  glints: {
    url: 'https://glints.com/id/opportunities/jobs',
    searchParam: 'query',
    pagination: 'load-more',
    selectors: {
      jobList: 'a.job-card',
      title: '.job-title',
      company: '.company-name',
      location: '.location',
      url: 'a.job-card@href',
    },
  },
  jobstreet: {
    url: 'https://www.jobstreet.com/id/jobs',
    searchParam: 'keywords',
    pagination: 'page-number',
    selectors: {
      jobList: '[data-automation="jobListingCard"]',
      title: '[data-automation="jobTitle"]',
      company: '[data-automation="companyName"]',
      location: '[data-automation="location"]',
      url: 'a[data-automation="jobTitle"]@href',
    },
  },
  linkedin: {
    url: 'https://www.linkedin.com/jobs/search',
    searchParam: 'keywords',
    pagination: 'page-number',
    selectors: {
      jobList: '.job-card-container',
      title: '.job-card-list__title',
      company: '.job-card-container__company-name',
      location: '.job-card-container__metadata',
      url: 'a.job-card-list__title@href',
    },
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scraper/selectors/config.ts
git commit -m "feat: add pre-seeded platform selector configs"
```

---

## Task 3: Selector Loader

**Files:**
- Create: `scripts/scraper/selector-loader.ts`

- [ ] **Step 1: Write selector loader**

```ts
import { platformSelectors, type PlatformName, type PlatformSelector } from './selectors/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const USER_SELECTORS_PATH = path.join(__dirname, 'selectors', 'user-updated.json');

export function loadSelectors(platform: PlatformName): PlatformSelector {
  const base = platformSelectors[platform];

  // Load user-updated selectors if they exist (from AI re-extraction)
  if (existsSync(USER_SELECTORS_PATH)) {
    try {
      const userSelectors = JSON.parse(readFileSync(USER_SELECTORS_PATH, 'utf-8'));
      if (userSelectors[platform]) {
        return { ...base, selectors: { ...base.selectors, ...userSelectors[platform].selectors } };
      }
    } catch {
      // Ignore parse errors, use base
    }
  }

  return base;
}

export function saveUserSelectors(
  platform: PlatformName,
  selectors: Partial<PlatformSelector['selectors']>
): void {
  let userSelectors: Record<string, Partial<PlatformSelector['selectors']>> = {};

  if (existsSync(USER_SELECTORS_PATH)) {
    try {
      userSelectors = JSON.parse(readFileSync(USER_SELECTORS_PATH, 'utf-8'));
    } catch {
      // Ignore
    }
  }

  userSelectors[platform] = { ...userSelectors[platform], ...selectors };
  writeFileSync(USER_SELECTORS_PATH, JSON.stringify(userSelectors, null, 2));
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scraper/selector-loader.ts
git commit -m "feat: add selector loader with user-updated override support"
```

---

## Task 4: AI Validator + Selector Re-extractor

**Files:**
- Create: `scripts/scraper/ai-validator.ts`

- [ ] **Step 1: Write AI validator**

```ts
import type { PlatformName } from './selectors/config';
import type { PlatformSelector } from './selectors/config';

interface ValidationResult {
  valid: boolean;
  reason?: string;
  newSelectors?: Partial<PlatformSelector['selectors']>;
}

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');
  return key;
}

export async function validateJobs(
  jobs: unknown[],
  platform: PlatformName
): Promise<ValidationResult> {
  if (!jobs || jobs.length === 0) {
    return { valid: false, reason: 'No jobs extracted' };
  }

  const requiredFields = ['title', 'company', 'url'];
  const validJobs = jobs.filter((job: unknown) => {
    if (!job || typeof job !== 'object') return false;
    const j = job as Record<string, unknown>;
    return requiredFields.every((f) => j[f] && typeof j[f] === 'string');
  });

  if (validJobs.length === 0) {
    return { valid: false, reason: 'All jobs missing required fields (title, company, url)' };
  }

  return { valid: true };
}

export async function reExtractSelectors(
  platform: PlatformName,
  currentSelectors: PlatformSelector,
  pageHtml: string
): Promise<Partial<PlatformSelector['selectors']>> {
  const key = getOpenRouterKey();
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

  const prompt = `The selectors for ${platform} job site are broken and failed to extract valid job data.

Current selectors: ${JSON.stringify(currentSelectors.selectors)}

Page HTML snippet (first 2000 chars):
${pageHtml.slice(0, 2000)}

Please analyze the HTML and return NEW CSS selectors that will correctly extract:
- jobList: selector for the container of each job listing
- title: selector for the job title within a job listing
- company: selector for the company name within a job listing  
- location: selector for the location within a job listing
- url: selector for the link to the job detail page (use @href suffix if needed, e.g. "a@href")

Return ONLY valid JSON, no markdown:
{"selectors":{"jobList":"...","title":"...","company":"...","location":"...","url":"..."}}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenRouter');
  }

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse selectors from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.selectors;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scraper/ai-validator.ts
git commit -m "feat: add AI validator and selector re-extractor"
```

---

## Task 5: Puppeteer Runner (CLI Script)

**Files:**
- Create: `scripts/scraper/puppeteer-runner.ts`

- [ ] **Step 1: Write puppeteer runner**

```ts
#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { loadSelectors, saveUserSelectors } from './selector-loader';
import { validateJobs, reExtractSelectors } from './ai-validator';
import type { PlatformName, PlatformSelector } from './selectors/config';

interface Job {
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description: string | null;
}

function log(type: string, data: Record<string, unknown>) {
  console.error(JSON.stringify({ type, ...data }));
}

function extractAttribute(page: puppeteer.Page, selector: string): Promise<string | null> {
  if (selector.includes('@')) {
    const [sel, attr] = selector.split('@');
    return page.$eval(sel, (el, a) => (el as HTMLAnchorElement).getAttribute(a) ?? '', attr);
  }
  return page.$eval(selector, (el) => el.textContent?.trim() ?? '');
}

async function extractJobsFromPage(
  page: puppeteer.Page,
  selectors: PlatformSelector['selectors'],
  pageNum: number,
  total: number
): Promise<Job[]> {
  const jobElements = await page.$$(selectors.jobList);

  if (jobElements.length === 0) {
    log('debug', { message: `No job elements found on page ${pageNum}`, selectors: selectors.jobList });
  }

  const jobs: Job[] = [];

  for (const jobEl of jobElements) {
    try {
      const [title, company, location, url] = await Promise.all([
        jobEl.$(selectors.title).then((el) => el?.evaluate((e) => e.textContent?.trim() ?? '')),
        jobEl.$(selectors.company).then((el) => el?.evaluate((e) => e.textContent?.trim() ?? '')),
        jobEl.$(selectors.location).then((el) => el?.evaluate((e) => e.textContent?.trim() ?? '')),
        jobEl.$(selectors.url).then((el) => el?.evaluate((e) => (e as HTMLAnchorElement).getAttribute('href') ?? '')),
      ]);

      if (title && url) {
        jobs.push({ title, company, location, url, description: null });
      }
    } catch {
      // Skip individual job extraction errors
    }
  }

  log('progress', { page: pageNum, total, jobs: jobs.length });
  return jobs;
}

async function waitForPagination(page: puppeteer.Page, pagination: string): Promise<boolean> {
  if (pagination === 'load-more') {
    try {
      await page.waitForSelector('button:has-text("Load more")', { timeout: 5000 });
      await page.click('button:has-text("Load more")');
      await page.waitForTimeout(2000);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function scrapePlatform(
  platform: PlatformName,
  keyword: string,
  maxPages: number
): Promise<{ jobs: Job[]; selectorUpdated: boolean }> {
  const config = loadSelectors(platform);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const searchUrl = `${config.url}?${config.searchParam}=${encodeURIComponent(keyword)}`;
  log('info', { message: `Navigating to ${searchUrl}` });
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  let allJobs: Job[] = [];
  let selectorUpdated = false;
  let currentPage = 1;

  while (currentPage <= maxPages) {
    log('info', { message: `Scraping page ${currentPage}/${maxPages}` });

    const jobs = await extractJobsFromPage(page, config.selectors, currentPage, maxPages);

    if (jobs.length === 0) {
      // Validation: check if selectors are broken
      try {
        const html = await page.content();
        const validation = await validateJobs([], platform);

        if (!validation.valid) {
          log('warning', { message: 'No jobs extracted, attempting selector re-extraction' });

          try {
            const newSelectors = await reExtractSelectors(platform, config, html);
            saveUserSelectors(platform, newSelectors);
            selectorUpdated = true;
            log('info', { message: 'Selectors updated, retrying with new selectors' });

            // Reload with new selectors
            const updatedConfig = loadSelectors(platform);
            const retryJobs = await extractJobsFromPage(page, updatedConfig.selectors, currentPage, maxPages);
            if (retryJobs.length > 0) {
              allJobs.push(...retryJobs);
            }
          } catch (err) {
            log('error', { message: `Selector re-extraction failed: ${err}` });
          }
        }
      } catch {
        // Skip validation on other errors
      }
    } else {
      allJobs.push(...jobs);
    }

    if (currentPage >= maxPages) break;

    const hasMore = await waitForPagination(page, config.pagination);
    if (!hasMore && config.pagination === 'page-number') {
      // Try page number navigation
      const nextPage = currentPage + 1;
      const nextUrl = `${searchUrl}&page=${nextPage}`;
      try {
        await page.goto(nextUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch {
        break;
      }
    } else if (!hasMore) {
      break;
    }

    currentPage++;
  }

  await browser.close();

  return { jobs: allJobs, selectorUpdated };
}

async function main() {
  const args = process.argv.slice(2);
  let keyword = 'frontend engineer';
  let platform: PlatformName = 'glints';
  let maxPages = 3;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--keyword' && args[i + 1]) keyword = args[++i];
    if (args[i] === '--platform' && args[i + 1]) platform = args[++i] as PlatformName;
    if (args[i] === '--max-pages' && args[i + 1]) maxPages = parseInt(args[++i], 10);
  }

  try {
    const result = await scrapePlatform(platform, keyword, maxPages);

    // Output JSON to stdout (for parent process to capture)
    console.log(JSON.stringify({ type: 'done', ...result }));
    process.exit(0);
  } catch (error) {
    log('error', { message: error instanceof Error ? error.message : 'Unknown error' });
    console.log(JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }));
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/scraper/puppeteer-runner.ts
```

- [ ] **Step 3: Commit**

```bash
git add scripts/scraper/puppeteer-runner.ts
git commit -m "feat: add puppeteer runner with AI selector validation"
```

---

## Task 6: Puppeteer Wrapper (child_process)

**Files:**
- Create: `src/lib/scraper/puppeteer-wrapper.ts`

- [ ] **Step 1: Write wrapper**

```ts
import { spawn } from 'node:child_process';
import path from 'node:path';

export interface ScraperProgress {
  type: 'progress' | 'done' | 'error' | 'info' | 'warning' | 'debug';
  page?: number;
  total?: number;
  jobs?: number;
  message?: string;
  jobsDone?: unknown[];
  selectorUpdated?: boolean;
  error?: string;
}

export interface ScraperOptions {
  keyword: string;
  platform: 'glints' | 'jobstreet' | 'linkedin';
  maxPages?: number;
}

export async function* runPuppeteerScraper(
  options: ScraperOptions
): AsyncGenerator<ScraperProgress, void, unknown> {
  const maxPages = options.maxPages ?? 3;
  const runnerPath = path.join(process.cwd(), 'scripts', 'scraper', 'puppeteer-runner.ts');

  const child = spawn('node', [runnerPath, '--keyword', options.keyword, '--platform', options.platform, '--max-pages', String(maxPages)], {
    env: { ...process.env },
  });

  let stderrBuffer = '';

  child.stderr?.on('data', (data: Buffer) => {
    stderrBuffer += data.toString();
    const lines = stderrBuffer.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        stderrBuffer = '';
        yield parsed as ScraperProgress;
      } catch {
        // Not JSON, might be partial — keep buffering
      }
    }
  });

  let stdoutBuffer = '';
  for await (const chunk of child.stdout!) {
    stdoutBuffer += chunk.toString();
  }

  // Parse final stdout as last result
  try {
    const final = JSON.parse(stdoutBuffer);
    if (final.type === 'done' || final.type === 'error') {
      yield final as ScraperProgress;
    }
  } catch {
    // Ignore parse errors
  }

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Scraper exited with code ${code}`));
    });
    child.on('error', reject);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scraper/puppeteer-wrapper.ts
git commit -m "feat: add puppeteer wrapper for child_process spawning"
```

---

## Task 7: Scrape API Route with SSE Support

**Files:**
- Modify: `src/app/api/jobs/scrape/route.ts`

- [ ] **Step 1: Read current route**

Read `src/app/api/jobs/scrape/route.ts` to understand current structure.

- [ ] **Step 2: Replace with SSE-enabled route**

```ts
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { parseJobsFromOutput } from '@/lib/scraper/parser';
import { getRequestUserId } from '@/lib/request-user';
import { ensureProfile } from '@/lib/supabase/profiles';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { runPuppeteerScraper, type ScraperProgress } from '@/lib/scraper/puppeteer-wrapper';
import type { JobPlatform } from '@/types/job';

const VALID_PLATFORMS: JobPlatform[] = ['glints', 'linkedin', 'jobstreet'];

export async function POST(request: NextRequest) {
  try {
    const { keyword, platform, userId: explicitUserId } = await request.json();

    if (!keyword || !platform) {
      return NextResponse.json({ error: 'Missing keyword or platform.' }, { status: 400 });
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
    }

    const userId = await getRequestUserId(request, explicitUserId);
    const supabase = createAdminClient() ?? (await createClient());
    await ensureProfile(supabase, userId);

    // Check for SSE request
    const accept = request.headers.get('Accept');
    if (accept === 'text/event-stream') {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of runPuppeteerScraper({ keyword, platform, maxPages: 3 })) {
              if (event.type === 'progress' || event.type === 'done' || event.type === 'error') {
                const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
            controller.close();
          } catch (err) {
            const errorEvent = `event: error\ndata: ${JSON.stringify({ error: err instanceof Error ? err.message : 'Scraping failed' })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Regular JSON response (fallback)
    let allJobs: unknown[] = [];
    let selectorUpdated = false;

    for await (const event of runPuppeteerScraper({ keyword, platform, maxPages: 3 })) {
      if (event.type === 'done') {
        allJobs = event.jobsDone ?? [];
        selectorUpdated = event.selectorUpdated ?? false;
      }
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert(
        allJobs.map((job: unknown) => {
          const j = job as Record<string, unknown>;
          return {
            user_id: userId,
            platform,
            title: j.title,
            company: j.company ?? null,
            location: j.location ?? null,
            url: j.url,
            salary_range: j.salary_range ?? null,
            description: j.description ?? null,
            status: 'saved',
          };
        }),
      )
      .select('*');

    if (error) throw error;

    return NextResponse.json({ jobs: data ?? [], count: data?.length ?? 0, selectorUpdated });
  } catch (error) {
    console.error('[Scrape Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed.' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/jobs/scrape/route.ts
git commit -m "feat: replace shell script runner with puppeteer + SSE support"
```

---

## Task 8: useScraperSSE Hook

**Files:**
- Create: `src/hooks/use-scraper-sse.ts`

- [ ] **Step 1: Write hook**

```ts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface ScraperProgress {
  type: 'progress' | 'done' | 'error' | 'info' | 'warning';
  page?: number;
  total?: number;
  jobs?: number;
  message?: string;
  error?: string;
  jobsDone?: unknown[];
  selectorUpdated?: boolean;
}

interface UseScraperSSEOptions {
  onDone?: (jobs: unknown[], selectorUpdated: boolean) => void;
  onError?: (error: string) => void;
}

export function useScraperSSE(options: UseScraperSSEOptions = {}) {
  const [status, setStatus] = useState<'idle' | 'scraping' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<ScraperProgress | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startScraping = useCallback(
    async (keyword: string, platform: string) => {
      setStatus('scraping');
      setProgress(null);

      try {
        const response = await fetch('/api/jobs/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword, platform }),
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? 'Scraping failed');
        }

        // Check if SSE response
        const contentType = response.headers.get('Content-Type');
        if (contentType?.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (!reader) throw new Error('No response body');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                const eventType = line.slice(7);
                const dataLine = lines.shift() ?? '';
                if (dataLine.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(dataLine.slice(6));
                    setProgress(data);

                    if (eventType === 'done') {
                      setStatus('done');
                      options.onDone?.(data.jobs ?? [], data.selectorUpdated ?? false);
                    } else if (eventType === 'error') {
                      setStatus('error');
                      options.onError?.(data.error ?? 'Unknown error');
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } else {
          // Regular JSON response
          const data = await response.json();
          if (data.error) {
            setStatus('error');
            options.onError?.(data.error);
          } else {
            setStatus('done');
            options.onDone?.(data.jobs ?? [], data.selectorUpdated ?? false);
          }
        }
      } catch (err) {
        setStatus('error');
        options.onError?.(err instanceof Error ? err.message : 'Scraping failed');
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return { status, progress, startScraping };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-scraper-sse.ts
git commit -m "feat: add useScraperSSE hook for progress streaming"
```

---

## Task 9: ScraperProgress Component

**Files:**
- Create: `src/components/scraper/scraper-progress.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client';

import type { ScraperProgress } from '@/hooks/use-scraper-sse';

interface ScraperProgressProps {
  status: 'idle' | 'scraping' | 'done' | 'error';
  progress: ScraperProgress | null;
  onRetry?: () => void;
}

export function ScraperProgress({ status, progress, onRetry }: ScraperProgressProps) {
  if (status === 'idle') return null;

  return (
    <div className="space-y-2">
      {status === 'scraping' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-48 animate-pulse rounded-full bg-slate-200" />
            <span className="text-sm text-slate-500">
              {progress?.message ?? `Scraping page ${progress?.page ?? '?'}/${progress?.total ?? '?'}`}
              {progress?.jobs !== undefined ? ` · ${progress.jobs} jobs found` : ''}
            </span>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span>✓</span>
          <span>
            {progress?.jobs ?? 0} jobs scraped
            {progress?.selectorUpdated ? ' · Selectors auto-updated' : ''}
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600">✗ {progress?.error ?? 'Scraping failed'}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scraper/scraper-progress.tsx
git commit -m "feat: add scraper progress UI component"
```

---

## Task 10: Wire ScraperProgress to Keywords Page

**Files:**
- Modify: `src/app/(dashboard)/keywords/page.tsx`

- [ ] **Step 1: Read current page**

Read the keywords page to understand how it currently handles scrape status.

- [ ] **Step 2: Update imports and state**

Add `useScraperSSE` hook and `ScraperProgress` component. Add `isScraping` and `scrapeError` state.

- [ ] **Step 3: Replace scrape button logic**

Replace the existing `handleScrape` to use `startScraping` from the hook, and add `ScraperProgress` component below the button.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/keywords/page.tsx
git commit -m "feat: wire scraper progress to keywords page"
```

---

## Task 11: Wire ScraperProgress to Jobs Page

**Files:**
- Modify: `src/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 1: Read current page**

- [ ] **Step 2: Add scraper progress to jobs page**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/jobs/page.tsx
git commit -m "feat: add scraper progress to jobs page"
```

---

## Task 12: Mark Placeholder Scripts as Deprecated

**Files:**
- Modify: `scripts/glints-scraper.sh`, `scripts/jobstreet-scraper.sh`, `scripts/linkedin-scraper.sh`

- [ ] **Step 1: Add deprecation header to each script**

```bash
# DEPRECATED: This is a placeholder script.
# Real scraping is now done via Puppeteer in scripts/scraper/puppeteer-runner.ts
# This file is kept for backwards compatibility reference.
```

- [ ] **Step 2: Commit**

```bash
git add scripts/glints-scraper.sh scripts/jobstreet-scraper.sh scripts/linkedin-scraper.sh
git commit -m "chore: mark shell scripts as deprecated placeholders"
```

---

## Task 13: Install Chrome/Chromium for Puppeteer

**Files:**
(None — system dependency)

- [ ] **Step 1: Check if Chrome is available**

```bash
which google-chrome || which chromium || which chromium-browser
```

- [ ] **Step 2: If not found, install Chromium for Puppeteer**

On macOS:
```bash
brew install chromium
# Or download Chrome from https://www.google.com/chrome/
```

Puppeteer will auto-download Chromium if needed, but having system Chrome can be faster.

- [ ] **Step 3: Note in .env.local if using custom Chrome path**

If using custom Chrome, add to `.env.local`:
```
PUPPETEER_EXECUTABLE_PATH=/path/to/chromium
```

---

## Verification

After all tasks:

1. **Test scrape flow:** Upload CV → Generate keywords → Start scrape → Watch progress bar → Check jobs page for results

2. **Verify SSE:** Open browser DevTools → Network → filter by `/api/jobs/scrape` → should see SSE stream with progress events

3. **Test selector recovery:** If scraping returns 0 jobs, verify AI re-extraction is triggered (check terminal logs)

---

## Notes

- The `ai-validator.ts` and `puppeteer-runner.ts` use `console.error` for logs (stderr) and `console.log` for stdout JSON — this separation is important for the wrapper to parse events correctly
- Puppeteer launches headless Chrome — first run will download Chromium if not cached
- SSE streaming requires the API route to hold the connection open — browser will show "pending" in network tab during scrape
- The `useScraperSSE` hook handles both SSE and regular JSON responses as fallbacks
