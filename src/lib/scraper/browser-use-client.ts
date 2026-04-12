import { spawn } from 'node:child_process';
import path from 'node:path';

export interface ScraperProgress {
  type: 'progress' | 'done' | 'error' | 'info' | 'warning' | 'debug';
  page?: number;
  total?: number;
  jobs?: number;
  message?: string;
  jobsDone?: unknown[];
  validationPassed?: boolean;
  validationMessage?: string;
  retryUsed?: boolean;
  error?: string;
}

export interface ScraperOptions {
  keyword: string;
  platform: 'glints' | 'jobstreet' | 'linkedin';
  maxPages?: number;
}

export async function* runBrowserUseScraper(
  options: ScraperOptions
): AsyncGenerator<ScraperProgress, void, unknown> {
  const maxPages = options.maxPages ?? 3;
  const runnerPath = path.join(process.cwd(), 'scripts', 'scraper', 'browser-use-runner.ts');

  const child = spawn(
    'node',
    [
      runnerPath,
      '--keyword',
      options.keyword,
      '--platform',
      options.platform,
      '--max-pages',
      String(maxPages),
    ],
    { env: { ...process.env } }
  );

  const stderrEvents: ScraperProgress[] = [];

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        stderrEvents.push(JSON.parse(line) as ScraperProgress);
      } catch {
        // Not JSON, skip
      }
    }
  });

  let stdoutBuffer = '';
  for await (const chunk of child.stdout!) {
    stdoutBuffer += chunk.toString();
  }

  for (const event of stderrEvents) {
    yield event;
  }

  try {
    const final = JSON.parse(stdoutBuffer);
    if (final.type === 'done' || final.type === 'error') {
      yield final as ScraperProgress;
    }
  } catch {
    // Ignore parse errors
  }

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on('close', resolve);
    child.on('error', reject);
  });

  if (exitCode !== 0) {
    throw new Error(`Scraper exited with code ${exitCode}`);
  }
}