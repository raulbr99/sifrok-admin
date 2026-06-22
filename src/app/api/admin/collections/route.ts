import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function isAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === 'admin';
}

function parseArr(s: string | null): unknown[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

type CollectionRow = {
  colors: string | null;
  garmentTypes: string | null;
  [k: string]: unknown;
};

export function serializeCollection(c: CollectionRow) {
  return { ...c, colors: parseArr(c.colors), garmentTypes: parseArr(c.garmentTypes) };
}

// GET — list collections with their designs
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { designs: { orderBy: { createdAt: 'asc' } } },
  });
  return NextResponse.json(collections.map(serializeCollection));
}

// POST — create a collection
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
  const c = await prisma.collection.create({
    data: {
      name: String(body.name),
      description: body.description ? String(body.description) : null,
      colors: JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
      garmentTypes: JSON.stringify(Array.isArray(body.garmentTypes) ? body.garmentTypes : []),
    },
    include: { designs: true },
  });
  return NextResponse.json(serializeCollection(c), { status: 201 });
}
