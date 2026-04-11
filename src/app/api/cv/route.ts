import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') ?? request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });
    }

    const supabase = createAdminClient() ?? (await createClient());
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load CVs.' },
      { status: 500 },
    );
  }
}
