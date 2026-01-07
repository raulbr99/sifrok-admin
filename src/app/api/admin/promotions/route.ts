import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar todas las promociones
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // TODO: Verificar que el usuario sea admin
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 403 }
    //   );
    // }

    const promotions = await prisma.promotion.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ promotions });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener promociones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva promoción
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Validaciones
    if (!data.name || !data.type || data.value === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        code: data.code || null,
        type: data.type,
        value: parseFloat(data.value),
        isActive: data.isActive ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        minAmount: data.minAmount ? parseFloat(data.minAmount) : null,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        applyTo: data.applyTo || 'ALL',
        categoryFilter: data.categoryFilter || null,
        productFilter: data.productFilter || null,
      },
    });

    return NextResponse.json({ promotion });
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear promoción' },
      { status: 500 }
    );
  }
}
