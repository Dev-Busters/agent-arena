import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../_proxy';

export async function GET(req: NextRequest) {
  try {
    const res = await proxyToBackend(req, '/api/leaderboard');
    if (!res.ok) {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Leaderboard API] Backend error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
