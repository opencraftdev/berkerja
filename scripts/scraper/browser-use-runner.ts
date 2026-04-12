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

interface ScrapeResult {
  jobs: Job[];
  validationPassed: boolean;
  validationMessage?: string;
  retryUsed: boolean;
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

  switch (platform) {
    case 'glints':
      return `Go to ${url}. This is a job listing page on Glints Indonesia.

Scroll down to reveal more job listings. Click the "Load more" button if it appears to load more jobs.

For each job listing visible on the page, extract:
- title: the job title text
- company: the company name
- location: the location text (e.g. "Jakarta", "Remote", "Bandung")
- url: the full URL to the job detail page

Extract as many jobs as possible from all loaded listings. Return ALL jobs found in a JSON object with a "jobs" array.`;
    case 'jobstreet':
      return `Go to ${url}. This is a job listing page on Jobstreet Indonesia.

Browse through the search results. If there are page numbers at the bottom, you can navigate to more pages (up to ${maxPages} pages total).

For each job listing, extract:
- title: the job title
- company: the company name
- location: the location
- url: the full URL to the job detail page

Return ALL jobs found across all pages in a JSON object with a "jobs" array.`;
    case 'linkedin':
      return `Go to ${url}. This is a job search page on LinkedIn.

Scroll down to load more job listings. You can click "Show more" or similar buttons to reveal more results.

For each job listing visible, extract:
- title: the job title
- company: the company name
- location: the location text
- url: the full URL to the job detail page

Return ALL jobs found in a JSON object with a "jobs" array.`;
    default:
      return `Go to ${url} and extract job listings.`;
  }
}

function parseOutput(rawOutput: unknown): BrowserUseOutput {
  if (typeof rawOutput === 'string') {
    try {
      return JSON.parse(rawOutput) as BrowserUseOutput;
    } catch {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as BrowserUseOutput;
      }
      throw new Error('Could not parse output as JSON');
    }
  }
  if (typeof rawOutput === 'object' && rawOutput !== null) {
    return rawOutput as BrowserUseOutput;
  }
  throw new Error(`Unexpected output type: ${typeof rawOutput}`);
}

async function runBrowserUse(
  platform: PlatformName,
  keyword: string,
  maxPages: number
): Promise<{ jobs: Job[]; success: boolean }> {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey) {
    throw new Error('BROWSER_USE_API_KEY not set');
  }

  const client = new BrowserUse({ apiKey });
  const task = buildTaskPrompt(platform, keyword, maxPages);

  log('info', { message: `Starting Browser Use session for ${platform}...` });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client.run as any)(task, {
    model: 'gemini-3-flash',
    maxCostUsd: 0.5,
  });

  log('info', { message: `Session completed. Status: ${result.status}` });
  log('info', { message: `Steps taken: ${result.stepCount}` });
  log('info', { message: `Cost: ${result.totalCostUsd}` });

  if (!result.output) {
    throw new Error('No output from Browser Use session');
  }

  const output = parseOutput(result.output);

  if (!output.jobs || !Array.isArray(output.jobs)) {
    throw new Error('Invalid output format from Browser Use');
  }

  const jobs: Job[] = output.jobs.map((j) => ({
    title: j.title || '',
    company: j.company || null,
    location: j.location || null,
    url: j.url || '',
    description: null,
  })).filter((j) => j.title && j.url);

  return { jobs, success: result.isTaskSuccessful ?? false };
}

async function scrapeWithRetry(
  platform: PlatformName,
  keyword: string,
  maxPages: number
): Promise<ScrapeResult> {
  log('info', { message: `Starting scrape for ${platform} with keyword "${keyword}"` });

  const firstResult = await runBrowserUse(platform, keyword, maxPages);
  const firstJobs = firstResult.jobs;

  log('info', { message: `First extraction: ${firstJobs.length} jobs` });

  const validation = await validateJobs(firstJobs, platform);

  if (validation.valid) {
    return {
      jobs: firstJobs,
      validationPassed: true,
      retryUsed: false,
    };
  }

  log('warning', { message: `Validation failed: ${validation.reason}. Retrying...` });

  const retryResult = await runBrowserUse(platform, keyword, maxPages);
  const retryValidation = await validateJobs(retryResult.jobs, platform);

  if (retryValidation.valid) {
    return {
      jobs: retryResult.jobs,
      validationPassed: true,
      retryUsed: true,
    };
  }

  return {
    jobs: retryResult.jobs.length > 0 ? retryResult.jobs : firstJobs,
    validationPassed: false,
    validationMessage: retryValidation.reason ?? validation.reason,
    retryUsed: true,
  };
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

  if (!['glints', 'jobstreet', 'linkedin'].includes(platform)) {
    console.error(JSON.stringify({ type: 'error', message: `Invalid platform: ${platform}` }));
    process.exit(1);
  }

  try {
    const result = await scrapeWithRetry(platform, keyword, maxPages);

    console.log(
      JSON.stringify({
        type: 'done',
        jobs: result.jobs,
        jobsDone: result.jobs,
        validationPassed: result.validationPassed,
        validationMessage: result.validationMessage,
        retryUsed: result.retryUsed,
      })
    );
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log('error', { message });
    console.log(JSON.stringify({ type: 'error', error: message }));
    process.exit(1);
  }
}

main();