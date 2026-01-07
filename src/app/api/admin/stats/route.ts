import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    // Verificar que es admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // Estadísticas generales
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalReviews,
      ordersToday,
      revenueToday,
      ordersThisMonth,
      revenueThisMonth,
      ordersLastMonth,
      revenueLastMonth,
      pendingOrders,
      newUsersToday,
      newUsersThisMonth,
    ] = await Promise.all([
      // Total órdenes (pagadas+)
      prisma.order.count({
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      }),
      // Total revenue
      prisma.order.aggregate({
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { total: true },
      }),
      // Total usuarios
      prisma.user.count(),
      // Total reviews
      prisma.review.count(),
      // Órdenes hoy
      prisma.order.count({
        where: {
          createdAt: { gte: today },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
      // Revenue hoy
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { total: true },
      }),
      // Órdenes este mes
      prisma.order.count({
        where: {
          createdAt: { gte: thisMonth },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
      // Revenue este mes
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thisMonth },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { total: true },
      }),
      // Órdenes mes pasado
      prisma.order.count({
        where: {
          createdAt: { gte: lastMonth, lt: thisMonth },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
      // Revenue mes pasado
      prisma.order.aggregate({
        where: {
          createdAt: { gte: lastMonth, lt: thisMonth },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { total: true },
      }),
      // Órdenes pendientes de envío
      prisma.order.count({
        where: { status: 'PROCESSING' },
      }),
      // Nuevos usuarios hoy
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      // Nuevos usuarios este mes
      prisma.user.count({
        where: { createdAt: { gte: thisMonth } },
      }),
    ]);

    // Órdenes últimos 7 días para gráfico
    const ordersLast7Days = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: last7Days },
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    // Top productos
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productName', 'productId'],
      where: {
        order: {
          createdAt: { gte: last30Days },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Órdenes recientes
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { select: { productName: true, quantity: true } },
      },
    });

    // Calcular cambios porcentuales
    const revenueChange = revenueLastMonth._sum.total
      ? (((revenueThisMonth._sum.total || 0) - revenueLastMonth._sum.total) /
          revenueLastMonth._sum.total) *
        100
      : 0;

    const ordersChange = ordersLastMonth
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
      : 0;

    return NextResponse.json({
      overview: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalUsers,
        totalReviews,
        pendingOrders,
      },
      today: {
        orders: ordersToday,
        revenue: revenueToday._sum.total || 0,
        newUsers: newUsersToday,
      },
      thisMonth: {
        orders: ordersThisMonth,
        revenue: revenueThisMonth._sum.total || 0,
        newUsers: newUsersThisMonth,
        revenueChange: Math.round(revenueChange * 10) / 10,
        ordersChange: Math.round(ordersChange * 10) / 10,
      },
      charts: {
        last7Days: ordersLast7Days.map((d) => ({
          date: d.createdAt,
          orders: d._count.id,
          revenue: d._sum.total || 0,
        })),
      },
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        productId: p.productId,
        quantity: p._sum.quantity || 0,
        orders: p._count.id,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        date: o.createdAt,
        customer: o.user.name || o.user.email,
        total: o.total,
        status: o.status,
        items: o.orderItems.length,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
