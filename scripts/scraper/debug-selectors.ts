#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const keyword = 'frontend engineer';
  const url = `https://glints.com/id/opportunities/jobs?query=${encodeURIComponent(keyword)}`;

  console.error(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get the full job card with all details
  const fullCard = await page.evaluate(() => {
    // Find the outer card container
    const cards = document.querySelectorAll('[class*="CompactOpportunityCardsc"]');
    
    if (cards.length === 0) return 'No cards found';
    
    const card = cards[0];
    const allElements = card.querySelectorAll('*');
    const elements = Array.from(allElements).slice(0, 20).map(el => ({
      tag: el.tagName,
      class: el.className,
      text: el.textContent?.trim().slice(0, 100),
    }));
    
    return JSON.stringify({
      outerHTML: card.outerHTML.slice(0, 3000),
      elements: elements,
    }, null, 2);
  });

  console.log(JSON.stringify({ type: 'fullCard' }, null, 2));
  console.log(fullCard);

  // Try to find company and location in common patterns
  const companyLocation = await page.evaluate(() => {
    // Look for company - it's usually in a sibling or parent element
    const titleAnchor = document.querySelector('a[href*="/id/opportunities/"]');
    const titleParent = titleAnchor?.parentElement?.parentElement?.parentElement?.parentElement;
    
    if (!titleParent) return 'No parent found';
    
    // Find company name - look for class containing "company"
    let companyEl = null;
    let locationEl = null;
    
    const allEls = titleParent.querySelectorAll('*');
    for (const el of allEls) {
      const cls = el.className.toLowerCase();
      const text = el.textContent?.trim() || '';
      if (cls.includes('company') && text.length < 100) {
        companyEl = { class: el.className, text: text.slice(0, 100) };
      }
      if ((cls.includes('location') || cls.includes('lokasi') || cls.includes('address')) && text.length < 100) {
        locationEl = { class: el.className, text: text.slice(0, 100) };
      }
    }
    
    return JSON.stringify({ companyEl, locationEl, parentClass: titleParent.className });
  });

  console.log(JSON.stringify({ type: 'companyLocation' }, null, 2));
  console.log(companyLocation);

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});