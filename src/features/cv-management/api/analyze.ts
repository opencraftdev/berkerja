import { createClient } from '@/lib/supabase/client';
import { generateKeywords, KeywordResult } from '@/lib/deepagents/cv-agent';
import { CV } from '@/types/cv';

export async function analyzeCV(cv: CV): Promise<KeywordResult> {
  const result = await generateKeywords(cv.raw_text);

  const supabase = createClient();

  const { error: keywordError } = await supabase.from('keywords').insert({
    user_id: cv.user_id,
    cv_id: cv.id,
    queries: result.keywords,
    generation_notes: result.reasoning,
  });

  if (keywordError) throw keywordError;

  const { error: cvError } = await supabase
    .from('cvs')
    .update({ analysis_result: result })
    .eq('id', cv.id);

  if (cvError) {
    await supabase.from('keywords').delete().eq('cv_id', cv.id);
    throw cvError;
  }

  return result;
}
