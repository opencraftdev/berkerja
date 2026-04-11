export interface CvAnalysisResult {
  skills: string[];
  roles: string[];
  experience_years: number;
  education: string[];
  summary: string;
  keywords?: string[];
  reasoning?: string;
}

export interface CV {
  id: string;
  user_id: string;
  raw_text: string;
  file_name: string;
  analysis_result: CvAnalysisResult | null;
  created_at: string;
}
