import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function isAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === 'admin';
}

// PATCH — rename a design or (re)assign it to a collection (collectionId:null = quitar)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: { name?: string; collectionId?: string | null } = {};
  if (typeof body?.name === 'string') data.name = body.name;
  if (body && 'collectionId' in body) data.collectionId = body.collectionId ? String(body.collectionId) : null;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 });
  }
  try {
    const design = await prisma.design.update({
      where: { id },
      data,
      include: { collection: { select: { id: true, name: true } } },
    });
    return NextResponse.json(design);
  } catch {
    return NextResponse.json({ error: 'Diseño no encontrado.' }, { status: 404 });
  }
}

// DELETE — remove a saved design
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.design.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Diseño no encontrado.' }, { status: 404 });
  }
}
