import { NextRequest, NextResponse } from 'next/server';
import { getNotices, createNotice } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const notices = await getNotices();
    return NextResponse.json(notices);
  } catch (error) {
    console.error('Get notices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verifyToken(token ?? '');

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, content, category = 'general', priority = 'normal', expiresAt } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const notice = await createNotice({
      title,
      content,
      authorId: decoded.userId,
      category,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    console.error(notice, 'this is the notice')

    if(!notice.success || notice.error) {
      return NextResponse.json(
        { error: notice.error || 'Failed to create notice' },
        { status: 500 }
      );
    }

    // Broadcast to all connected clients
    // await wsManager.broadcastNotice(notice);

    return NextResponse.json(notice, { status: 201 });

  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json(
      { error: 'Failed to create notice' },
      { status: 500 }
    );
  }
}