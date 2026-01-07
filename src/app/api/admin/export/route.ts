import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'orders';
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let data: string;
    let filename: string;

    switch (type) {
      case 'orders': {
        const orders = await prisma.order.findMany({
          where: {
            createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          },
          include: {
            user: { select: { name: true, email: true } },
            orderItems: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (format === 'csv') {
          const headers = [
            'ID',
            'Fecha',
            'Cliente',
            'Email',
            'Total',
            'Estado',
            'Productos',
            'Direccion',
            'Ciudad',
            'Codigo Postal',
            'Pais',
            'Tracking',
          ];
          const rows = orders.map((o) => [
            o.id,
            new Date(o.createdAt).toISOString(),
            o.user.name || '',
            o.user.email,
            o.total.toFixed(2),
            o.status,
            o.orderItems.map((i) => `${i.productName} x${i.quantity}`).join('; '),
            o.shippingAddress || '',
            o.shippingCity || '',
            o.shippingZipCode || '',
            o.shippingCountry || '',
            o.trackingNumber || '',
          ]);
          data = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
          filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          data = JSON.stringify(orders, null, 2);
          filename = `pedidos_${new Date().toISOString().split('T')[0]}.json`;
        }
        break;
      }

      case 'users': {
        const users = await prisma.user.findMany({
          where: {
            createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { orders: true, reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (format === 'csv') {
          const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Fecha Registro', 'Pedidos', 'Reviews'];
          const rows = users.map((u) => [
            u.id,
            u.name || '',
            u.email,
            u.role,
            new Date(u.createdAt).toISOString(),
            u._count.orders,
            u._count.reviews,
          ]);
          data = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
          filename = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          data = JSON.stringify(users, null, 2);
          filename = `usuarios_${new Date().toISOString().split('T')[0]}.json`;
        }
        break;
      }

      case 'reviews': {
        const reviews = await prisma.review.findMany({
          where: {
            createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          },
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (format === 'csv') {
          const headers = [
            'ID',
            'Producto',
            'Usuario',
            'Email',
            'Rating',
            'Titulo',
            'Comentario',
            'Verificado',
            'Fecha',
          ];
          const rows = reviews.map((r) => [
            r.id,
            r.productName,
            r.user.name || '',
            r.user.email,
            r.rating,
            r.title || '',
            r.comment || '',
            r.isVerified ? 'Si' : 'No',
            new Date(r.createdAt).toISOString(),
          ]);
          data = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
          filename = `reviews_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          data = JSON.stringify(reviews, null, 2);
          filename = `reviews_${new Date().toISOString().split('T')[0]}.json`;
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Tipo no valido' }, { status: 400 });
    }

    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    return new NextResponse(data, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
