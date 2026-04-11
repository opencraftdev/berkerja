# Puppeteer Scraper Design

## Overview

Replace placeholder shell-script scrapers with real Puppeteer-based scrapers that extract job listings from job platforms. The scraper uses a hybrid approach: pre-seeded CSS selectors for known platforms, validated and auto-updated by AI when structure changes are detected.

## Architecture

```
User clicks "Start scraping"
       ↓
/api/jobs/scrape (existing endpoint)
       ↓
Spawn: node --experimental-vm-modules scripts/scraper/puppeteer-runner.ts
       ↓
Puppeteer script:
  1. Load pre-seeded selectors for platform
  2. Launch headless Chrome → navigate to job site
  3. Extract jobs using selectors → return JSON
       ↓
SSE Stream → Browser UI (progress: "Scraping page 3/10")
       ↓
AI Validation (OpenRouter):
  - Check: title, company, url present?
  - If FAIL → AI re-extracts selectors → retry once
       ↓
Save to DB → return to UI
```

## Components

### 1. Puppeteer Runner Script
**File:** `scripts/scraper/puppeteer-runner.ts`

- Accepts CLI args: `--keyword`, `--platform`, `--max-pages`
- Loads platform selector config
- Launches headless Chrome via Puppeteer
- Navigates to job site, paginates through results
- Extracts job data using CSS selectors
- Outputs JSON to stdout, logs to stderr
- Emits SSE-ready progress events

**Key implementation:**
- `puppeteer.launch()` with headless Chrome
- `page.goto()` with pagination via "Load more" or page numbers
- `page.$$eval()` for batch extraction using selector config
- `console.log(JSON.stringify({ type: 'progress', page: 3, total: 10, jobs: 45 }))` for SSE

### 2. Selector Config
**File:** `scripts/scraper/selectors/config.ts`

Pre-seeded selectors for known platforms:

```ts
export const platformSelectors = {
  glints: {
    url: 'https://glints.com/id/opportunities/jobs',
    searchParam: 'query', // URL param for keyword
    pagination: 'load-more', // 'load-more' | 'page-number'
    selectors: {
      jobList: 'a.job-card',
      title: '.job-title',
      company: '.company-name',
      location: '.location',
      url: 'a.job-card@href', // attribute selector
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

### 3. AI Validator + Selector Re-extractor
**File:** `scripts/scraper/ai-validator.ts`

Uses OpenRouter to validate scraped data and re-extract selectors if validation fails.

```ts
interface ValidationResult {
  valid: boolean;
  reason?: string;
  newSelectors?: Partial<PlatformSelector>;
}

export async function validateAndFix(
  jobs: unknown[],
  platform: Platform,
  currentSelectors: PlatformSelector
): Promise<ValidationResult>
```

**Validation rules:**
- Required fields: `title`, `company`, `url`
- If any job missing required fields → validation fails
- If ALL jobs missing required fields → trigger selector re-extraction

**Re-extraction prompt:**
```
The selectors for {platform} are broken. The current selectors failed to extract valid job data.

Current selectors: {JSON.stringify(currentSelectors)}
Page HTML snippet: {first 2000 chars of job list HTML}

Please return new CSS selectors that will work. Return JSON format:
{{"selectors": {{"jobList": "...", "title": "...", "company": "...", "url": "..."}}}}
```

### 4. SSE Progress Streaming
**File:** `src/app/api/jobs/scrape/route.ts`

The scrape route upgrades to SSE for progress streaming:

```ts
export async function POST(request: NextRequest) {
  // Check Accept header for SSE
  if (request.headers.get('Accept') === 'text/event-stream') {
    // Return SSE stream with progress events
  }
  // Otherwise return regular JSON response
}
```

**SSE event format:**
```
event: progress
data: {"page":3,"total":10,"jobs":45}

event: done
data: {"jobs": [...], "count": 45, "selectorUpdated": false}

event: error
data: {"error": "Validation failed after retry"}
```

### 5. UI Progress Component
**File:** `src/components/scraper/scraper-progress.tsx`

Shows real-time progress bar in the browser:

```tsx
// "Scraping page 3/10... 45 jobs found"
```

States:
- **Idle** — no active scrape
- **Scraping** — progress bar animating
- **Done** — success, shows job count
- **Error** — shows error message, retry button
- **Selector Updated** — shows "Selectors auto-updated" notice

## Data Flow

### Normal Flow (selectors work)
1. User submits scrape request
2. SSE connection opens
3. Puppeteer launches → navigates → extracts page 1
4. SSE sends: `{"page":1,"total":5,"jobs":25}`
5. Repeat for each page
6. All pages done → save to DB
7. SSE sends: `{"type":"done","jobs":[...],"count":45}`

### Recovery Flow (selectors broken)
1. Steps 1-4 same
2. AI validates extracted data → FAIL (missing title field)
3. Puppeteer-runner calls AI selector re-extractor
4. New selectors returned → retry scrape once
5. Retry succeeds → SSE sends `{"selectorUpdated":true}`
6. Save to DB → done

### Failure Flow (unrecoverable)
1. Retry also fails
2. SSE sends: `{"type":"error","error":"..."}`
3. Return error to UI

## Files to Create/Modify

### New files:
- `scripts/scraper/puppeteer-runner.ts` — main Puppeteer script
- `scripts/scraper/selectors/config.ts` — platform selector configs
- `scripts/scraper/ai-validator.ts` — OpenRouter validation + re-extraction
- `scripts/scraper/selector-loader.ts` — loads/merges pre-seeded + AI-updated selectors
- `src/components/scraper/scraper-progress.tsx` — UI progress component
- `src/hooks/use-scraper-sse.ts` — SSE hook for browser

### Modified files:
- `scripts/glints-scraper.sh` — mark as deprecated/placeholder
- `scripts/jobstreet-scraper.sh` — mark as deprecated/placeholder
- `scripts/linkedin-scraper.sh` — mark as deprecated/placeholder
- `src/app/api/jobs/scrape/route.ts` — spawn Puppeteer instead of shell script
- `src/app/(dashboard)/keywords/page.tsx` — add ScraperProgress component
- `src/app/(dashboard)/jobs/page.tsx` — add ScraperProgress component

## Dependencies

```bash
npm install puppeteer
npm install -D @types/puppeteer
```

## Selector Storage

Selectors updated by AI are stored in:
- **Memory only** (per-run) — simplest, re-extracted each time scraper runs
- **File system** — `scripts/scraper/selectors/user-updated.ts`, committed to repo
- **Database** — `selectors` table in Supabase, shared across runs

**Chosen: File system** — persists across restarts without DB complexity.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Chrome fails to launch | Return error, don't retry |
| Page load timeout (30s) | Retry once, then fail |
| Zero jobs extracted | AI validation fails → re-extract selectors → retry once |
| AI API fails | Skip validation, use raw data, log warning |
| Retry also fails | Return error with last error message |
| User cancels (SSE closes) | Kill Puppeteer process via `process.kill()` |

## Testing Approach

1. **Unit test** `ai-validator.ts` — mock OpenRouter, test validation logic
2. **Integration test** `puppeteer-runner.ts` — run against real Glints (rate limited)
3. **E2E test** — full flow with mocked browser
