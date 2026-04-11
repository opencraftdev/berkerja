import { NextRequest, NextResponse } from 'next/server';

import { extractCvText } from '@/lib/cv/extract-text';
import { ensureProfile } from '@/lib/supabase/profiles';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!(file instanceof File) || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing file or user id.' }, { status: 400 });
    }

    const rawText = await extractCvText(file);
    const supabase = createAdminClient() ?? (await createClient());
    await ensureProfile(supabase, userId);
    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: userId,
        raw_text: rawText,
        file_name: file.name,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[CV Upload Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 },
    );
  }
}
