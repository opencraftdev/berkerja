import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { parseJobsFromOutput } from '@/lib/scraper/parser';
import { getRequestUserId } from '@/lib/request-user';
import { runScraperScript } from '@/lib/scraper/runner';
import { ensureProfile } from '@/lib/supabase/profiles';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { JobPlatform } from '@/types/job';

const scriptMap: Record<JobPlatform, string> = {
  glints: 'glints-scraper.sh',
  linkedin: 'linkedin-scraper.sh',
  jobstreet: 'jobstreet-scraper.sh',
};

export async function POST(request: NextRequest) {
  try {
    const { keyword, platform, userId: explicitUserId } = await request.json();

    if (!keyword || !platform) {
      return NextResponse.json({ error: 'Missing keyword or platform.' }, { status: 400 });
    }

    const userId = await getRequestUserId(request, explicitUserId);
    const scriptPath = path.join(process.cwd(), 'scripts', scriptMap[platform as JobPlatform]);
    console.log('[Scrape] Running scraper for keyword:', keyword, 'platform:', platform);

    const result = await runScraperScript(scriptPath, { KEYWORD: keyword });
    console.log('[Scrape] Script result:', result.success ? 'success' : 'failed', result.output.slice(0, 200), result.error);

    if (!result.success) {
      throw new Error(result.error ?? 'Scraper failed.');
    }

    const jobs = parseJobsFromOutput(result.output);
    console.log('[Scrape] Parsed jobs:', jobs.length);
    const supabase = createAdminClient() ?? (await createClient());
    await ensureProfile(supabase, userId);
    const { data, error } = await supabase
      .from('jobs')
      .insert(
        jobs.map((job) => ({
          user_id: userId,
          platform,
          title: job.title,
          company: job.company ?? null,
          location: job.location ?? null,
          url: job.url,
          salary_range: job.salary_range ?? null,
          description: job.description ?? null,
          status: 'saved',
        })),
      )
      .select('*');

    if (error) {
      throw error;
    }

    return NextResponse.json({ jobs: data ?? [], count: data?.length ?? 0 });
  } catch (error) {
    console.error('[Scrape Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed.' },
      { status: 500 },
    );
  }
}
