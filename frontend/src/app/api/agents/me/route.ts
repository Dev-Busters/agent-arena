import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-production-6816.up.railway.app';

async function proxy(req: NextRequest, backendPath: string) {
  const url = `${BACKEND}${backendPath}`;
  const auth = req.headers.get('authorization') ?? '';
  const body = req.method !== 'GET' ? await req.text() : undefined;
  const res = await fetch(url, {
    method: req.method,
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body,
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) { return proxy(req, '/api/agents/me'); }
export async function PUT(req: NextRequest) { return proxy(req, '/api/agents/me'); }
