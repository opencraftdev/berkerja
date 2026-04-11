import { NextRequest, NextResponse } from 'next/server';
import { getKeywords, updateKeywords } from '@/features/keyword-generation/api/generate';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keywords = await getKeywords(user.id);
    return NextResponse.json(keywords);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keywordId, queries } = await request.json();

    if (!keywordId || !queries) {
      return NextResponse.json(
        { error: 'Missing keywordId or queries' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('keywords')
      .select('id')
      .eq('id', keywordId)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const keyword = await updateKeywords(keywordId, queries);
    return NextResponse.json(keyword);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keywordId } = await request.json();

    if (!keywordId) {
      return NextResponse.json({ error: 'Missing keywordId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', keywordId)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}