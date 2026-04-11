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
  
  try {
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (err) {
    log('warning', { message: `Page load timeout or error: ${err}` });
  }

  let allJobs: Job[] = [];
  let selectorUpdated = false;
  let currentPage = 1;

  while (currentPage <= maxPages) {
    log('progress', { page: currentPage, total: maxPages, jobs: allJobs.length });

    const jobElements = await page.$$(config.selectors.jobList);
    log('info', { message: `Found ${jobElements.length} job elements on page ${currentPage}` });

    if (jobElements.length === 0) {
      const html = await page.content();
      const validation = await validateJobs([], platform);

      if (!validation.valid) {
        log('warning', { message: 'No jobs extracted, attempting selector re-extraction' });
        try {
          const newSelectors = await reExtractSelectors(platform, config, html);
          saveUserSelectors(platform, newSelectors);
          selectorUpdated = true;
          log('info', { message: 'Selectors updated, retrying' });

          const updatedConfig = loadSelectors(platform);
          const retryElements = await page.$$(updatedConfig.selectors.jobList);
          
          for (const jobEl of retryElements) {
            const title = await jobEl.$(updatedConfig.selectors.title).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null);
            const company = await jobEl.$(updatedConfig.selectors.company).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null);
            const location = await jobEl.$(updatedConfig.selectors.location).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null);
            const url = await jobEl.$(updatedConfig.selectors.url).then(el => el?.evaluate(e => (e as HTMLAnchorElement).getAttribute('href') ?? '') ?? null);
            
            if (title && url) {
              allJobs.push({ title, company, location, url, description: null });
            }
          }
        } catch (err) {
          log('error', { message: `Selector re-extraction failed: ${err}` });
        }
      }
    } else {
      for (const jobEl of jobElements) {
        try {
          const [title, company, location, url] = await Promise.all([
            jobEl.$(config.selectors.title).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null),
            jobEl.$(config.selectors.company).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null),
            jobEl.$(config.selectors.location).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null),
            jobEl.$(config.selectors.url).then(el => el?.evaluate(e => (e as HTMLAnchorElement).getAttribute('href') ?? '') ?? null),
          ]);

          if (title && url) {
            allJobs.push({ title, company, location, url, description: null });
          }
        } catch {
          // Skip individual job extraction errors
        }
      }
    }

    if (currentPage >= maxPages) break;

    const hasMore = await page.$('button:has-text("Load more")').then(el => el !== null);
    
    if (hasMore) {
      try {
        await page.click('button:has-text("Load more")');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch {
        break;
      }
    } else if (config.pagination === 'page-number') {
      const nextPage = currentPage + 1;
      const nextUrl = `${searchUrl}&page=${nextPage}`;
      try {
        await page.goto(nextUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch {
        break;
      }
    } else {
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
    console.log(JSON.stringify({ type: 'done', ...result }));
    process.exit(0);
  } catch (error) {
    log('error', { message: error instanceof Error ? error.message : 'Unknown error' });
    console.log(JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }));
    process.exit(1);
  }
}

main();
