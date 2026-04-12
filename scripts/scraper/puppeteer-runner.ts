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

function parseAriaLabel(label: string): { title: string; company: string; location: string } | null {
  // Format: "Job: {title}, Company: {company}, Location: {location}"
  const match = label.match(/Job:\s*(.+?),\s*Company:\s*(.+?),\s*Location:\s*(.+)/i);
  if (match) {
    return { title: match[1].trim(), company: match[2].trim(), location: match[3].trim() };
  }
  return null;
}

function getAttributeValue(el: puppeteer.ElementHandle | null, selector: string): string | null {
  if (!el) return null;
  if (selector.startsWith('@')) {
    return el.evaluate((e, attr) => e.getAttribute(attr) ?? '', selector.slice(1));
  }
  return el.evaluate((e, s) => {
    const found = e.querySelector(s);
    if (!found) return null;
    if (s.startsWith('@')) {
      const attr = s.slice(1);
      return (found as HTMLElement).getAttribute(attr) ?? '';
    }
    return found.textContent?.trim() ?? '';
  }, selector);
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
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for JS to render
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
            allJobs.push(...await extractJobs(page, updatedConfig, currentPage, maxPages));
          } catch (err) {
            log('error', { message: `Selector re-extraction failed: ${err}` });
          }
        }
      } else {
        allJobs.push(...await extractJobs(page, config, currentPage, maxPages));
      }

      if (currentPage >= maxPages) break;

      const hasMore = await page.$('button').then(el => el !== null);

      if (hasMore) {
        try {
          await page.click('button');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch {
          break;
        }
      } else if (config.pagination === 'page-number') {
        const nextUrl = `${searchUrl}&page=${currentPage + 1}`;
        try {
          await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
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

async function extractJobs(
  page: puppeteer.Page,
  config: PlatformSelector,
  pageNum: number,
  total: number
): Promise<Job[]> {
  const jobs: Job[] = [];

  // Check if using aria-label parsing (Glints style)
  if (config.selectors.title === '@aria:job') {
    // Extract from aria-label: "Job: {title}, Company: {company}, Location: {location}"
    const extracted = await page.$$eval(config.selectors.jobList, (els) => {
      return els.map(el => {
        const ariaLabel = el.getAttribute('aria-label') || '';
        const parsed = ariaLabel.match(/Job:\s*(.+?),\s*Company:\s*(.+?),\s*Location:\s*(.+)/i);
        const titleAnchor = el.querySelector('a[href*="/id/opportunities/"]');
        const url = titleAnchor?.getAttribute('href') || '';
        if (parsed) {
          return {
            title: parsed[1].trim(),
            company: parsed[2].trim(),
            location: parsed[3].trim(),
            url,
          };
        }
        return null;
      }).filter(Boolean);
    });

    for (const job of extracted) {
      if (job && job.url) {
        jobs.push({ ...job, description: null });
      }
    }
  } else {
    // Standard CSS selector extraction
    const jobElements = await page.$$(config.selectors.jobList);

    for (const jobEl of jobElements) {
      try {
        const titleSel = config.selectors.title;
        const companySel = config.selectors.company;
        const locationSel = config.selectors.location;
        const urlSel = config.selectors.url;

        let title: string | null = null;
        let company: string | null = null;
        let location: string | null = null;
        let url: string | null = null;

        if (titleSel.startsWith('@aria:')) {
          const attr = titleSel.replace('@aria:', '');
          const ariaLabel = await jobEl.evaluate(el => el.getAttribute(attr) || '');
          const parsed = ariaLabel.match(/Job:\s*(.+?),\s*Company:\s*(.+?),\s*Location:\s*(.+)/i);
          if (parsed) {
            title = parsed[1].trim();
            company = parsed[2].trim();
            location = parsed[3].trim();
          }
        } else {
          title = await jobEl.$(titleSel).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null;
          company = await jobEl.$(companySel).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null;
          location = await jobEl.$(locationSel).then(el => el?.evaluate(e => e.textContent?.trim() ?? '') ?? null);
        }

        if (urlSel.startsWith('@')) {
          url = await jobEl.evaluate((el, attr) => {
            const anchor = el.querySelector(`[href*="/id/opportunities/"]`) as HTMLAnchorElement | null;
            return anchor?.getAttribute(attr) ?? '';
          }, urlSel.slice(1)) as string | null;
        } else {
          url = await jobEl.$(urlSel).then(el => el?.evaluate((e: Element) => (e as HTMLAnchorElement).getAttribute('href') ?? '') ?? null);
        }

if (title && url) {
        const fullUrl = url.startsWith('http') ? url : `https://glints.com${url}`;
        jobs.push({ title, company, location, url: fullUrl, description: null });
        }
      } catch {
        // Skip individual job extraction errors
      }
    }
  }

  log('progress', { page: pageNum, total, jobs: jobs.length });
  return jobs;
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