import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

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