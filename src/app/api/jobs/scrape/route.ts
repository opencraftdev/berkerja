import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobs } from '@/features/job-scraping/api/scrape';
import { createClient } from '@/lib/supabase/server';
import { JobPlatform } from '@/features/job-scraping/types/job';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, keyword } = await request.json();

    const validPlatforms: JobPlatform[] = ['glints', 'linkedin', 'jobstreet'];

    if (!platform || !keyword) {
      return NextResponse.json(
        { error: 'Missing platform or keyword' },
        { status: 400 }
      );
    }

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    const jobs = await scrapeJobs({ platform, keyword, userId: user.id });
    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    );
  }
}