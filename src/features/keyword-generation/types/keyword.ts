export interface Keyword {
  id: string;
  user_id: string;
  cv_id: string | null;
  queries: string[];
  generation_notes: string | null;
  created_at: string;
  updated_at: string;
}