import { NextRequest, NextResponse } from 'next/server';

import { generateKeywords } from '@/lib/deepagents/cv-agent';
import { getRequestUserId } from '@/lib/request-user';
import { ensureProfile } from '@/lib/supabase/profiles';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { cvId, userId: explicitUserId } = await request.json();

    if (!cvId || typeof cvId !== 'string') {
      return NextResponse.json({ error: 'Missing cvId.' }, { status: 400 });
    }

    const userId = await getRequestUserId(request, explicitUserId);
    const supabase = createAdminClient() ?? (await createClient());
    await ensureProfile(supabase, userId);
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .eq('user_id', userId)
      .single();

    if (cvError || !cv) {
      throw cvError ?? new Error('CV not found.');
    }

    const result = await generateKeywords(cv.raw_text);

    const { error: updateCvError } = await supabase
      .from('cvs')
      .update({ analysis_result: result.analysis })
      .eq('id', cvId)
      .eq('user_id', userId);

    if (updateCvError) {
      throw updateCvError;
    }

    const { error: keywordError } = await supabase.from('keywords').upsert(
      {
        user_id: userId,
        cv_id: cvId,
        queries: result.keywords,
        generation_notes: result.reasoning,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,cv_id' },
    );

    if (keywordError) {
      throw keywordError;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CV Analyze Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed.' },
      { status: 500 },
    );
  }
}
