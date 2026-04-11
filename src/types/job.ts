export type JobPlatform = 'glints' | 'linkedin' | 'jobstreet';
export type JobStatus = 'new' | 'clicked' | 'pending' | 'applied';

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description_snippet: string | null;
  full_description: string | null;
  platform: JobPlatform;
  keyword_query: string | null;
  status: JobStatus;
  scraped_at: string | null;
  created_at: string;
}
