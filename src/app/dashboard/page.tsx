'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
} from 'lucide-react';
import AdminExportButton from '@/components/AdminExportButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';

interface Stats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalReviews: number;
    pendingOrders: number;
  };
  today: {
    orders: number;
    revenue: number;
    newUsers: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
    newUsers: number;
    revenueChange: number;
    ordersChange: number;
  };
  topProducts: {
    name: string;
    productId: string;
    quantity: number;
    orders: number;
  }[];
  recentOrders: {
    id: string;
    date: string;
    customer: string;
    total: number;
    status: string;
    items: number;
  }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusTone = (
    status: string
  ): 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
    const tones: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
      PENDING: 'warning',
      PAID: 'info',
      PROCESSING: 'info',
      SHIPPED: 'info',
      DELIVERED: 'success',
      CANCELLED: 'danger',
      FAILED: 'neutral',
    };
    return tones[status] || 'neutral';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6" role="status" aria-live="polite">
            <span className="sr-only">Cargando estadísticas…</span>
            <div className="h-8 bg-surface-2 rounded-card w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-surface-2 rounded-card" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="alert">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="primary" onClick={fetchStats}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Resumen" subtitle="Vista general de tu tienda" actions={<AdminExportButton />} />

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Ingresos Totales</p>
                <p className="text-2xl font-bold text-ink">
                  {formatCurrency(stats.overview.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-bg rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.thisMonth.revenueChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success mr-1" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger mr-1" aria-hidden="true" />
              )}
              <span
                className={
                  stats.thisMonth.revenueChange >= 0
                    ? 'text-success'
                    : 'text-danger'
                }
              >
                {stats.thisMonth.revenueChange >= 0 ? '+' : ''}
                {stats.thisMonth.revenueChange}%
              </span>
              <span className="text-ink-muted ml-2">vs mes anterior</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Pedidos Totales</p>
                <p className="text-2xl font-bold text-ink">
                  {stats.overview.totalOrders}
                </p>
              </div>
              <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-ink" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.thisMonth.ordersChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success mr-1" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger mr-1" aria-hidden="true" />
              )}
              <span
                className={
                  stats.thisMonth.ordersChange >= 0
                    ? 'text-success'
                    : 'text-danger'
                }
              >
                {stats.thisMonth.ordersChange >= 0 ? '+' : ''}
                {stats.thisMonth.ordersChange}%
              </span>
              <span className="text-ink-muted ml-2">vs mes anterior</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Usuarios</p>
                <p className="text-2xl font-bold text-ink">
                  {stats.overview.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-info-bg rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-info" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 text-sm text-ink-muted">
              +{stats.thisMonth.newUsers} este mes
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Pendientes de Envío</p>
                <p className="text-2xl font-bold text-ink">
                  {stats.overview.pendingOrders}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-bg rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-warning" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 text-sm text-ink-muted">
              Requieren atención
            </div>
          </Card>
        </div>

        {/* Today stats */}
        <div className="bg-panel rounded-card border border-panel-border p-6 mb-8 text-on-panel">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-accent">
            <Clock className="w-5 h-5" aria-hidden="true" />
            Hoy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-on-panel-muted">Pedidos</p>
              <p className="text-3xl font-bold">{stats.today.orders}</p>
            </div>
            <div>
              <p className="text-on-panel-muted">Ingresos</p>
              <p className="text-3xl font-bold">
                {formatCurrency(stats.today.revenue)}
              </p>
            </div>
            <div>
              <p className="text-on-panel-muted">Nuevos Usuarios</p>
              <p className="text-3xl font-bold">{stats.today.newUsers}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top products */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-ink mb-4">
              Top Productos (30 días)
            </h2>
            {stats.topProducts.length > 0 ? (
              <ol className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <li key={product.productId} className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 bg-accent rounded-full flex items-center justify-center font-bold text-accent-ink"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">
                        <span className="sr-only">Puesto {index + 1}: </span>
                        {product.name}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {product.quantity} unidades en {product.orders} pedidos
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-ink-muted">No hay datos aún</p>
            )}
          </Card>

          {/* Recent orders */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-ink mb-4">
              Pedidos Recientes
            </h2>
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 p-3 bg-surface-2 rounded-card"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-ink-muted truncate">{order.customer}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium text-ink">{formatCurrency(order.total)}</p>
                      <Badge tone={getStatusTone(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-muted">No hay pedidos aún</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
