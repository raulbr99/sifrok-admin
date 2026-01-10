'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateStripeFee } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { OrderStatus } from '@prisma/client'

export interface OrderFilters {
  status?: OrderStatus[]
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface ProfitCalculation {
  salePrice: number
  productionCost: number
  stripeFee: number
  netProfit: number
  margin: number
}

/**
 * Obtener ordenes con filtros
 */
export async function getOrders(filters?: OrderFilters) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const where: any = {}

  if (filters?.status?.length) {
    where.status = { in: filters.status }
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo
    }
  }

  if (filters?.search) {
    where.OR = [
      { id: { contains: filters.search, mode: 'insensitive' } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  return prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      orderItems: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Obtener una orden por ID
 */
export async function getOrderById(orderId: string) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      orderItems: true,
    },
  })
}

/**
 * Actualizar estado de una orden
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath('/admin/orders')
  return order
}

/**
 * Calcular profit de una orden
 */
export async function calculateOrderProfit(orderId: string): Promise<ProfitCalculation> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  })

  if (!order) throw new Error('Orden no encontrada')

  const salePrice = order.total
  const stripeFee = calculateStripeFee(salePrice)

  // Obtener coste de produccion de Gelato via ProductMapping
  let productionCost = 0
  for (const item of order.orderItems) {
    const mapping = await prisma.productMapping.findUnique({
      where: { localProductId: item.productId },
    })
    if (mapping) {
      productionCost += mapping.basePrice * item.quantity
    }
  }

  const netProfit = salePrice - productionCost - stripeFee
  const margin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0

  // Actualizar orden con calculos
  await prisma.order.update({
    where: { id: orderId },
    data: { productionCost, stripeFee, netProfit },
  })

  revalidatePath('/admin/orders')

  return { salePrice, productionCost, stripeFee, netProfit, margin }
}

/**
 * Obtener estadisticas de rentabilidad
 */
export async function getProfitabilityStats(period: 'week' | 'month' | 'year' = 'month') {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const now = new Date()
  let dateFrom: Date

  switch (period) {
    case 'week':
      dateFrom = new Date(now.setDate(now.getDate() - 7))
      break
    case 'year':
      dateFrom = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    default:
      dateFrom = new Date(now.setMonth(now.getMonth() - 1))
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: dateFrom },
      status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
    },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalCosts = orders.reduce((sum, o) => sum + (o.productionCost || 0), 0)
  const totalFees = orders.reduce(
    (sum, o) => sum + (o.stripeFee || calculateStripeFee(o.total)),
    0
  )
  const netProfit = totalRevenue - totalCosts - totalFees
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalCosts,
    totalFees,
    netProfit,
    margin,
    orderCount: orders.length,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    avgProfit: orders.length > 0 ? netProfit / orders.length : 0,
  }
}
