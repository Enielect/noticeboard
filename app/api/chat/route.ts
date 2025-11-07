import { NextRequest, NextResponse } from 'next/server';
import { createChatMessage } from '@/lib/db';
import { verifyToken } from '@/lib/auth';


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

    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const chatMessage = await createChatMessage(message.trim(), decoded.userId);
    console.log("chat successfully added.")
    return NextResponse.json(chatMessage, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}