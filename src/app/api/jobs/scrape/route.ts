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
    const result = await runScraperScript(scriptPath, { KEYWORD: keyword });

    if (!result.success) {
      throw new Error(result.error ?? 'Scraper failed.');
    }

    const jobs = parseJobsFromOutput(result.output);
    const supabase = createAdminClient() ?? (await createClient());
    await ensureProfile(supabase, userId);
    const { data, error } = await supabase
      .from('jobs')
      .insert(
        jobs.map((job) => ({
          ...job,
          user_id: userId,
          keyword_query: keyword,
          platform,
          status: 'new',
          scraped_at: new Date().toISOString(),
        })),
      )
      .select('*');

    if (error) {
      throw error;
    }

    return NextResponse.json({ jobs: data ?? [], count: data?.length ?? 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed.' },
      { status: 500 },
    );
  }
}
