import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const VALID_ROLES = new Set(['PROFESSOR', 'CURRENT', 'ALUMNI']);

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const data = await request.json();
    const { name, position, description, image, email, degree, role } = data ?? {};

    if (
      !name || typeof name !== 'string' ||
      !position || typeof position !== 'string' ||
      !email || typeof email !== 'string' ||
      !role || typeof role !== 'string' || !VALID_ROLES.has(role)
    ) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const newPerson = await prisma.person.create({
      data: {
        name,
        position,
        description: typeof description === 'string' ? description : null,
        image: typeof image === 'string' ? image : null,
        email,
        degree: typeof degree === 'string' ? degree : null,
        role: role as any,
      },
    });
    return NextResponse.json(newPerson, { status: 201 });
  } catch (error: any) {
    console.error('Error creating person:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
