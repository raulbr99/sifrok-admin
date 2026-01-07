import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar promoción
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { id } = await params;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code || null,
        type: data.type,
        value: parseFloat(data.value),
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        minAmount: data.minAmount ? parseFloat(data.minAmount) : null,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        applyTo: data.applyTo,
        categoryFilter: data.categoryFilter || null,
        productFilter: data.productFilter || null,
      },
    });

    return NextResponse.json({ promotion });
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar promoción' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar promoción
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.promotion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar promoción' },
      { status: 500 }
    );
  }
}
