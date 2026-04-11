import { createClient } from '@/lib/supabase/client';
import { CV } from '@/types/cv';

export async function uploadCV(file: File, userId: string): Promise<CV> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  let rawText = '';
  
  if (file.name.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(buffer);
    rawText = pdfData.text;
  } else if (file.name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value;
  } else {
    throw new Error('Unsupported file type');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('cvs')
    .insert({
      user_id: userId,
      raw_text: rawText,
      file_name: file.name,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserCVs(userId: string): Promise<CV[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
