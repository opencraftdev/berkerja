import { spawn } from 'node:child_process';
import path from 'node:path';
import { Readable } from 'node:stream';

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

async function* streamToAsyncIterable(stream: NodeJS.ReadableStream): AsyncGenerator<string> {
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    yield chunk.toString();
  }
}

async function* parseJsonStream(stream: NodeJS.ReadableStream): AsyncGenerator<ScraperProgress> {
  let buffer = '';
  for await (const text of streamToAsyncIterable(stream)) {
    buffer += text;
    const lines = buffer.split('\n');
    for (const line of lines.slice(0, -1)) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line) as ScraperProgress;
      } catch {
        // Not JSON, skip
      }
    }
    buffer = lines[lines.length - 1] || '';
  }
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer) as ScraperProgress;
    } catch {
      // Not JSON, skip
    }
  }
}

export async function* runPuppeteerScraper(
  options: ScraperOptions
): AsyncGenerator<ScraperProgress, void, unknown> {
  const maxPages = options.maxPages ?? 3;
  const runnerPath = path.join(process.cwd(), 'scripts', 'scraper', 'puppeteer-runner.ts');
  const tsxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');

  const child = spawn(tsxPath, [runnerPath, '--keyword', options.keyword, '--platform', options.platform, '--max-pages', String(maxPages)], {
    env: { ...process.env },
  });

  const stderrIterable = parseJsonStream(child.stderr!);
  const stdoutChunks: string[] = [];

  const readStdout = (async () => {
    for await (const text of streamToAsyncIterable(child.stdout!)) {
      stdoutChunks.push(text);
    }
  })();

  for await (const progress of stderrIterable) {
    yield progress;
  }

  await readStdout;

  const stdoutBuffer = stdoutChunks.join('');
  try {
    const final = JSON.parse(stdoutBuffer);
    if (final.type === 'done' || final.type === 'error') {
      yield final as ScraperProgress;
    }
  } catch {
    // Ignore parse errors
  }

  return new Promise((resolve, reject) => {
    let stderrOutput = '';
    child.stderr?.on('data', (data) => { stderrOutput += data.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Scraper exited with code ${code}${stderrOutput ? ': ' + stderrOutput : ''}`));
    });
    child.on('error', reject);
  });
}
