export interface CV {
  id: string;
  user_id: string;
  raw_text: string;
  file_name: string;
  analysis_result: CVAnalysis | null;
  created_at: string;
}

export interface CVAnalysis {
  skills: string[];
  roles: string[];
  experience_years: number;
  education: string[];
  summary: string;
}
