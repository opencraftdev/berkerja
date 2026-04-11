import { createClient } from '@/lib/supabase/client';
import { Keyword } from '../types/keyword';

export async function getKeywords(userId: string): Promise<Keyword[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('keywords')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateKeywords(
  keywordId: string,
  queries: string[]
): Promise<Keyword> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('keywords')
    .update({ queries, updated_at: new Date().toISOString() })
    .eq('id', keywordId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteKeywords(keywordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('keywords').delete().eq('id', keywordId);
  if (error) throw error;
}