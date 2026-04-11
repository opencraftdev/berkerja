import { NextRequest, NextResponse } from 'next/server';

import { getRequestUserId } from '@/lib/request-user';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { status } = await request.json();
    const { id } = await params;
    const userId = await getRequestUserId(request);
    const supabase = createAdminClient() ?? (await createClient());
    const { data, error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update job.' },
      { status: 500 },
    );
  }
}
