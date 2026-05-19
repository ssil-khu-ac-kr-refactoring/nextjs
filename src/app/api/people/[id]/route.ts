import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const VALID_ROLES = new Set(['PROFESSOR', 'CURRENT', 'ALUMNI']);

export async function GET(request: Request, context: any) {
  const { params } = context;
  try {
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }
    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person', error);
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { params } = context;
  try {
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
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

    const updatedPerson = await prisma.person.update({
      where: { id },
      data: {
        name,
        position,
        description: typeof description === 'string' ? description : null,
        image: typeof image === 'string' ? image : null,
        email,
        degree: typeof degree === 'string' ? degree : null,
        role: role as any,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(updatedPerson);
  } catch (error: any) {
    console.error('Error updating person', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { params } = context;
  try {
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await prisma.person.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting person', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
