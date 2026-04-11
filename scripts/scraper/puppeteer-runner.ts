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
  let browser;
  try {
    log('info', { message: `Launching browser for ${platform}...` });
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const config = loadSelectors(platform);
    const searchUrl = `${config.url}?${config.searchParam}=${encodeURIComponent(keyword)}`;
    log('info', { message: `Navigating to ${searchUrl}` });

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for JS to render
    } catch (err) {
      log('warning', { message: `Page load: ${err}` });
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
            log('info', { message: 'Selectors updated, retrying with new selectors' });

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

      const hasMore = await page.$('button').then(el => el !== null);

      if (hasMore) {
        try {
          await page.click('button');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch {
          break;
        }
      } else if (config.pagination === 'page-number') {
        const nextPage = currentPage + 1;
        const nextUrl = `${searchUrl}&page=${nextPage}`;
        try {
          await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch {
          break;
        }
      } else {
        break;
      }

      currentPage++;
    }

    return { jobs: allJobs, selectorUpdated };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    log('error', { message });
    console.log(JSON.stringify({ type: 'error', error: message }));
    process.exit(1);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(JSON.stringify({ type: 'error', error: message }));
  process.exit(1);
});