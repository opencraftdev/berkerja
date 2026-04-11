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

    console.log('[CV Analyze] Starting analysis for cvId:', cvId);
    
    const userId = await getRequestUserId(request, explicitUserId);
    console.log('[CV Analyze] userId:', userId);
    
    const supabase = createAdminClient() ?? (await createClient());
    await ensureProfile(supabase, userId);
    
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .eq('user_id', userId)
      .single();

    if (cvError || !cv) {
      console.log('[CV Analyze] CV not found or error:', cvError);
      throw cvError ?? new Error('CV not found.');
    }

    console.log('[CV Analyze] Calling generateKeywords with raw_text length:', cv.raw_text?.length);
    const result = await generateKeywords(cv.raw_text);
    console.log('[CV Analyze] generateKeywords result:', JSON.stringify(result).slice(0, 200));

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
