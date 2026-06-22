import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function isAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === 'admin';
}

// GET — list saved designs (optionally ?collectionId=)
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const collectionId = req.nextUrl.searchParams.get('collectionId');
  const designs = await prisma.design.findMany({
    where: collectionId ? { collectionId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(designs);
}

// POST — persist a generated design (optionally into a collection)
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.imageUrl) return NextResponse.json({ error: 'Falta la imagen.' }, { status: 400 });
  const design = await prisma.design.create({
    data: {
      name: body.name ? String(body.name) : `Diseño ${new Date().toISOString().slice(0, 10)}`,
      imageUrl: String(body.imageUrl),
      prompt: body.prompt ? String(body.prompt) : null,
      placement: body.placement ? String(body.placement) : null,
      size: body.size ? String(body.size) : null,
      collectionId: body.collectionId ? String(body.collectionId) : null,
    },
  });
  return NextResponse.json(design, { status: 201 });
}
