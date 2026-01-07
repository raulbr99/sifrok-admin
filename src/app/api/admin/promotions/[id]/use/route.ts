import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Incrementar uso de promoción
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    console.error('Error incrementing promotion usage:', error);
    return NextResponse.json(
      { error: error.message || 'Error al incrementar uso' },
      { status: 500 }
    );
  }
}
