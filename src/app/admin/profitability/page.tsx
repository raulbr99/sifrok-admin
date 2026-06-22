'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Percent,
  Package,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { getProfitabilityStats } from '@/actions/orders'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { inputClass } from '@/components/ui/Field'

interface Stats {
  totalRevenue: number
  totalCosts: number
  totalFees: number
  netProfit: number
  margin: number
  orderCount: number
  avgOrderValue: number
  avgProfit: number
}

export default function ProfitabilityPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [period])

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getProfitabilityStats(period)
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const periodLabels = {
    week: 'Ultima Semana',
    month: 'Ultimo Mes',
    year: 'Ultimo Anio',
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Rentabilidad"
        subtitle="Analiza ingresos, costes y margenes de beneficio"
        icon={TrendingUp}
        actions={
          <>
            <label htmlFor="period-select" className="sr-only">
              Periodo
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
              className={`${inputClass} w-auto`}
            >
              <option value="week">Ultima Semana</option>
              <option value="month">Ultimo Mes</option>
              <option value="year">Ultimo Anio</option>
            </select>
            <Button onClick={loadStats} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Actualizar
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
          <RefreshCw className="w-8 h-8 animate-spin text-ink-muted" aria-hidden="true" />
          <span className="sr-only">Cargando estadisticas...</span>
        </div>
      ) : stats ? (
        <div className="space-y-8" aria-live="polite">
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-info-bg rounded-card flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-info" aria-hidden="true" />
                </div>
                <span className="text-sm text-ink-muted">Ingresos Totales</span>
              </div>
              <p className="text-3xl font-bold text-ink">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-ink-muted mt-2">{periodLabels[period]}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-warning-bg rounded-card flex items-center justify-center">
                  <Package className="w-6 h-6 text-warning" aria-hidden="true" />
                </div>
                <span className="text-sm text-ink-muted">Costes Produccion</span>
              </div>
              <p className="text-3xl font-bold text-ink">{formatCurrency(stats.totalCosts)}</p>
              <p className="text-sm text-ink-muted mt-2">Printful</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-surface-2 rounded-card flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-ink-muted" aria-hidden="true" />
                </div>
                <span className="text-sm text-ink-muted">Comisiones Stripe</span>
              </div>
              <p className="text-3xl font-bold text-ink">{formatCurrency(stats.totalFees)}</p>
              <p className="text-sm text-ink-muted mt-2">2.9% + 0.30 EUR</p>
            </Card>

            <Card className="p-6 bg-accent border-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent-ink/10 rounded-card flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-ink" aria-hidden="true" />
                </div>
                <span className="text-sm text-accent-ink/80">Beneficio Neto</span>
              </div>
              <p className="text-3xl font-bold text-accent-ink">{formatCurrency(stats.netProfit)}</p>
              <div className="flex items-center gap-2 mt-2 text-accent-ink">
                <Percent className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">Margen: {stats.margin.toFixed(1)}%</span>
              </div>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-muted mb-1">Total Pedidos</p>
                  <p className="text-2xl font-bold text-ink">{stats.orderCount}</p>
                </div>
                <div className="w-12 h-12 bg-surface-2 rounded-card flex items-center justify-center">
                  <Package className="w-6 h-6 text-ink-muted" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-muted mb-1">Ticket Medio</p>
                  <p className="text-2xl font-bold text-ink">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
                <div className="w-12 h-12 bg-surface-2 rounded-card flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-ink-muted" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-muted mb-1">Profit Medio por Pedido</p>
                  <p className={`text-2xl font-bold ${stats.avgProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(stats.avgProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-card flex items-center justify-center ${stats.avgProfit >= 0 ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                  {stats.avgProfit >= 0 ? (
                    <ArrowUp className="w-6 h-6 text-success" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="w-6 h-6 text-danger" aria-hidden="true" />
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Breakdown */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">Desglose de Costes</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-muted">Costes de Produccion (Printful)</span>
                  <span className="text-sm font-medium text-ink">
                    {stats.totalRevenue > 0
                      ? ((stats.totalCosts / stats.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div
                  className="h-3 bg-surface-2 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Costes de produccion sobre ingresos"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(stats.totalRevenue > 0 ? (stats.totalCosts / stats.totalRevenue) * 100 : 0)}
                >
                  <div
                    className="h-full bg-warning rounded-full"
                    style={{
                      width: `${stats.totalRevenue > 0 ? (stats.totalCosts / stats.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-muted">Comisiones Stripe</span>
                  <span className="text-sm font-medium text-ink">
                    {stats.totalRevenue > 0
                      ? ((stats.totalFees / stats.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div
                  className="h-3 bg-surface-2 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Comisiones Stripe sobre ingresos"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(stats.totalRevenue > 0 ? (stats.totalFees / stats.totalRevenue) * 100 : 0)}
                >
                  <div
                    className="h-full bg-info rounded-full"
                    style={{
                      width: `${stats.totalRevenue > 0 ? (stats.totalFees / stats.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-muted">Beneficio Neto</span>
                  <span className="text-sm font-medium text-ink">{stats.margin.toFixed(1)}%</span>
                </div>
                <div
                  className="h-3 bg-surface-2 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Margen de beneficio neto"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(Math.abs(stats.margin))}
                >
                  <div
                    className={`h-full rounded-full ${stats.margin >= 0 ? 'bg-success' : 'bg-danger'}`}
                    style={{
                      width: `${Math.abs(stats.margin)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Formula */}
          <div className="bg-surface-2 rounded-card p-6 border border-border">
            <h3 className="text-sm font-semibold text-ink-muted mb-3">Formula de Calculo</h3>
            <div className="font-mono text-sm text-ink-muted">
              <p>
                <span className="text-success font-semibold">Beneficio Neto</span> ={' '}
                <span className="text-info">Ingresos ({formatCurrency(stats.totalRevenue)})</span> -{' '}
                <span className="text-warning">Coste produccion Printful ({formatCurrency(stats.totalCosts)})</span> -{' '}
                <span className="text-ink">Comisiones Stripe ({formatCurrency(stats.totalFees)})</span>
              </p>
              <p className="mt-2">
                <span className="text-success font-semibold">Beneficio Neto</span> ={' '}
                <span className="font-bold text-ink">{formatCurrency(stats.netProfit)}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-ink-muted" role="alert">No se pudieron cargar las estadisticas</div>
      )}
    </div>
  )
}
