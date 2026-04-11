import { createClient } from '@/lib/supabase/client';
import { Job, JobStatus } from '@/features/job-scraping/types/job';

export async function getJobs(
  userId: string,
  filters?: {
    platform?: string;
    status?: string;
  }
): Promise<Job[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filters?.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  userId: string
): Promise<Job> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}