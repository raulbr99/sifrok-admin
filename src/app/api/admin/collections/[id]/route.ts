import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeCollection } from '../route';

export const runtime = 'nodejs';

async function isAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === 'admin';
}

// PUT — update a collection's metadata (name/description/colors/garmentTypes)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
  try {
    const c = await prisma.collection.update({
      where: { id },
      data: {
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        colors: JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
        garmentTypes: JSON.stringify(Array.isArray(body.garmentTypes) ? body.garmentTypes : []),
      },
      include: { designs: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json(serializeCollection(c));
  } catch {
    return NextResponse.json({ error: 'Colección no encontrada.' }, { status: 404 });
  }
}

// DELETE — remove a collection and its designs
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.design.deleteMany({ where: { collectionId: id } });
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Colección no encontrada.' }, { status: 404 });
  }
}
