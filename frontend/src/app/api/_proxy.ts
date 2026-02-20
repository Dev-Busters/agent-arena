import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-production-6816.up.railway.app';

export async function proxyToBackend(req: NextRequest, backendPath: string, queryString?: string): Promise<NextResponse> {
  const qs = queryString ?? new URL(req.url).search;
  const url = `${BACKEND}${backendPath}${qs}`;
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
