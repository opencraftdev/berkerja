import { createClient } from '@/lib/supabase/client';
import { runScraperScript } from '@/lib/scraper/runner';
import { Job, JobPlatform } from '../types/job';

export interface ScrapeOptions {
  platform: JobPlatform;
  keyword: string;
  userId: string;
}

export async function scrapeJobs(options: ScrapeOptions): Promise<Job[]> {
  const scriptMap: Record<JobPlatform, string> = {
    glints: 'scripts/glints-scraper.sh',
    linkedin: 'scripts/linkedin-scraper.sh',
    jobstreet: 'scripts/jobstreet-scraper.sh',
  };

  const scriptPath = scriptMap[options.platform];
  if (!scriptPath) {
    throw new Error(`Unsupported platform: ${options.platform}`);
  }
  
  const result = await runScraperScript(scriptPath, {
    KEYWORD: options.keyword,
  });

  if (!result.success) {
    throw new Error(result.error || 'Scraping failed');
  }

  const jobs = parseJobsFromOutput(result.output, options);

  if (jobs.length === 0) {
    throw new Error('No jobs parsed from scraper output');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jobs')
    .insert(
      jobs.map((job) => ({
        ...job,
        user_id: options.userId,
        platform: options.platform,
        keyword_query: options.keyword,
        scraped_at: new Date().toISOString(),
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

function parseJobsFromOutput(output: string, options: ScrapeOptions): Partial<Job>[] {
  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed.filter(job => job.title && job.company && job.url);
    }
    console.error('Scraper output was not an array:', parsed);
    return [];
  } catch (err) {
    console.error('Failed to parse scraper output:', err);
    return [];
  }
}