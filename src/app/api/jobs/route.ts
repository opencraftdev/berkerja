import { NextRequest, NextResponse } from 'next/server';

import { getRequestUserId } from '@/lib/request-user';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const platform = request.nextUrl.searchParams.get('platform');
    const status = request.nextUrl.searchParams.get('status');
    const supabase = createAdminClient() ?? (await createClient());

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('scraped_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch jobs.' },
      { status: 500 },
    );
  }
}
