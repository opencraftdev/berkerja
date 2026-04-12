#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  
  // Set extra headers to look more like a real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*',
  });

  await page.goto('https://glints.com/id/opportunities/jobs?query=frontend', { 
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  await new Promise(r => setTimeout(r, 3000));

  // Get page content info
  const info = await page.evaluate(() => {
    const body = document.body.innerHTML;
    return {
      bodyLength: body.length,
      hasGlintsContent: body.includes('glints') || body.includes('Glints'),
      hasJobContent: body.includes('Job') || body.includes('job'),
      sampleAriaLabel: (document.querySelector('[aria-label]') || null) ? document.querySelector('[aria-label]').getAttribute('aria-label') : null,
      allTags: [...new Set([...document.querySelectorAll('*')].map(e => e.tagName))].slice(0, 20),
      divCount: document.querySelectorAll('div').length,
      bodySnippet: body.slice(0, 2000),
    };
  });

  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});