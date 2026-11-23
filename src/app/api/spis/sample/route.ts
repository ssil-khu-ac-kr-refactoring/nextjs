import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json(
    { error: 'Persistent sample data generation is disabled. Use the client-side demo preview instead.' },
    { status: 410 },
  );
}
