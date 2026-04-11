import { NextRequest, NextResponse } from 'next/server';

import { getRequestUserId } from '@/lib/request-user';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const supabase = createAdminClient() ?? (await createClient());
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch keywords.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { keywordId, queries } = await request.json();
    const userId = await getRequestUserId(request);

    if (!keywordId || !Array.isArray(queries)) {
      return NextResponse.json({ error: 'Missing keywordId or queries.' }, { status: 400 });
    }

    const supabase = createAdminClient() ?? (await createClient());
    const { data, error } = await supabase
      .from('keywords')
      .update({ queries, updated_at: new Date().toISOString() })
      .eq('id', keywordId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update keywords.' },
      { status: 500 },
    );
  }
}
