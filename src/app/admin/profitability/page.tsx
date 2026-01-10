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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            Rentabilidad
          </h1>
          <p className="text-gray-500 mt-1">Analiza ingresos, costes y margenes de beneficio</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="week">Ultima Semana</option>
            <option value="month">Ultimo Mes</option>
            <option value="year">Ultimo Anio</option>
          </select>
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Main Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Ingresos Totales</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-gray-500 mt-2">{periodLabels[period]}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">Costes Produccion</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalCosts)}</p>
              <p className="text-sm text-gray-500 mt-2">Gelato</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Comisiones Stripe</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalFees)}</p>
              <p className="text-sm text-gray-500 mt-2">2.9% + 0.30 EUR</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-sm opacity-80">Beneficio Neto</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(stats.netProfit)}</p>
              <div className="flex items-center gap-2 mt-2">
                <Percent className="w-4 h-4" />
                <span className="text-sm">Margen: {stats.margin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.orderCount}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ticket Medio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profit Medio por Pedido</p>
                  <p className={`text-2xl font-bold ${stats.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.avgProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.avgProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {stats.avgProfit >= 0 ? (
                    <ArrowUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <ArrowDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Desglose de Costes</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Costes de Produccion (Gelato)</span>
                  <span className="text-sm font-medium">
                    {stats.totalRevenue > 0
                      ? ((stats.totalCosts / stats.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${stats.totalRevenue > 0 ? (stats.totalCosts / stats.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Comisiones Stripe</span>
                  <span className="text-sm font-medium">
                    {stats.totalRevenue > 0
                      ? ((stats.totalFees / stats.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${stats.totalRevenue > 0 ? (stats.totalFees / stats.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Beneficio Neto</span>
                  <span className="text-sm font-medium">{stats.margin.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stats.margin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      width: `${Math.abs(stats.margin)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Formula de Calculo</h3>
            <div className="font-mono text-sm text-gray-600">
              <p>
                <span className="text-green-600 font-semibold">Beneficio Neto</span> ={' '}
                <span className="text-blue-600">Ingresos ({formatCurrency(stats.totalRevenue)})</span> -{' '}
                <span className="text-orange-600">Costes Gelato ({formatCurrency(stats.totalCosts)})</span> -{' '}
                <span className="text-purple-600">Comisiones Stripe ({formatCurrency(stats.totalFees)})</span>
              </p>
              <p className="mt-2">
                <span className="text-green-600 font-semibold">Beneficio Neto</span> ={' '}
                <span className="font-bold">{formatCurrency(stats.netProfit)}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">No se pudieron cargar las estadisticas</div>
      )}
    </div>
  )
}
