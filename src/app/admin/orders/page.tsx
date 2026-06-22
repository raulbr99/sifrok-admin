'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import {
  Package,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  DollarSign,
  Truck,
  XCircle,
} from 'lucide-react'
import { getOrders, calculateOrderProfit } from '@/actions/orders'
import { processRefund } from '@/actions/stripe'
import { syncPrintfulOrderStatus } from '@/actions/printful'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { inputClass } from '@/components/ui/Field'

interface Order {
  id: string
  userId: string
  stripeSessionId: string
  stripePaymentId: string | null
  total: number
  currency: string
  status: string
  printfulOrderId: string | null
  printfulStatus: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  carrier: string | null
  shippedAt: Date | null
  productionCost: number | null
  stripeFee: number | null
  netProfit: number | null
  createdAt: Date
  user: { name: string | null; email: string }
  orderItems: Array<{
    id: string
    productName: string
    quantity: number
    price: number
  }>
}

type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'accent'

const statusTones: Record<string, BadgeTone> = {
  PENDING: 'warning',
  PAID: 'info',
  PROCESSING: 'accent',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  FAILED: 'neutral',
}

const printfulStatusTones: Record<string, BadgeTone> = {
  draft: 'neutral',
  pending: 'info',
  inprocess: 'accent',
  onhold: 'warning',
  fulfilled: 'success',
  shipped: 'info',
  canceled: 'danger',
  failed: 'danger',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await getOrders()
      setOrders(data as Order[])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefund(orderId: string) {
    const order = orders.find((o) => o.id === orderId)
    const amountLabel = order
      ? `${order.total.toFixed(2)} ${order.currency.toUpperCase()}`
      : 'el importe del pedido'
    if (
      !(await confirm({
        title: `¿Reembolsar ${amountLabel}?`,
        message: `Se devolverá el pago del pedido ${orderId.slice(0, 8)} al cliente. Esta acción no se puede deshacer.`,
        confirmLabel: 'Reembolsar',
        tone: 'danger',
      }))
    ) {
      return
    }

    setProcessingId(orderId)
    try {
      const result = await processRefund(orderId)
      if (result.success) {
        toast.success(`Reembolso procesado: ${result.amount} EUR.`)
        loadOrders()
      } else {
        toast.error(`No se pudo procesar el reembolso. ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`No se pudo procesar el reembolso. Inténtalo de nuevo.`)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleSyncPrintful(orderId: string) {
    setProcessingId(orderId)
    try {
      await syncPrintfulOrderStatus(orderId)
      toast.success('Estado de Printful sincronizado.')
      loadOrders()
    } catch (error: any) {
      toast.error('No se pudo sincronizar con Printful. Inténtalo de nuevo.')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCalculateProfit(orderId: string) {
    setProcessingId(orderId)
    try {
      const profit = await calculateOrderProfit(orderId)
      toast.success(`Profit calculado: ${profit.netProfit.toFixed(2)} EUR (margen ${profit.margin.toFixed(1)}%).`)
      loadOrders()
    } catch (error: any) {
      toast.error('No se pudo calcular el profit. Inténtalo de nuevo.')
    } finally {
      setProcessingId(null)
    }
  }

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID Pedido',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.id.slice(0, 8)}...</span>
        ),
      },
      {
        accessorKey: 'user',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.user.name || 'Sin nombre'}</p>
            <p className="text-xs text-ink-muted">{row.original.user.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total
            <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.total.toFixed(2)} {row.original.currency.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado Pago',
        cell: ({ row }) => (
          <Badge tone={statusTones[row.original.status] || 'neutral'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'printfulStatus',
        header: 'Estado Printful',
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={printfulStatusTones[row.original.printfulStatus || ''] || 'neutral'}>
              {row.original.printfulStatus || 'No enviado'}
            </Badge>
            {row.original.trackingNumber && (
              <span className="text-xs text-ink-muted">
                {row.original.carrier ? `${row.original.carrier}: ` : ''}
                {row.original.trackingUrl ? (
                  <a
                    href={row.original.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-ink hover:underline"
                  >
                    {row.original.trackingNumber}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="font-mono">{row.original.trackingNumber}</span>
                )}
              </span>
            )}
            {row.original.shippedAt && (
              <span className="text-xs text-ink-muted">
                Enviado {row.original.shippedAt.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'netProfit',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit
            <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
          </button>
        ),
        cell: ({ row }) => {
          const profit = row.original.netProfit
          if (profit === null) {
            return <span className="text-ink-muted text-xs">Sin calcular</span>
          }
          return (
            <span className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
              {profit.toFixed(2)} EUR
            </span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Fecha
            <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.createdAt.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCalculateProfit(row.original.id)}
              disabled={processingId === row.original.id}
              className="p-2 text-ink-muted hover:text-success"
              title="Calcular profit"
              aria-label="Calcular profit"
            >
              <DollarSign className="w-4 h-4" aria-hidden="true" />
            </Button>
            {row.original.printfulOrderId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSyncPrintful(row.original.id)}
                disabled={processingId === row.original.id}
                className="p-2 text-ink-muted hover:text-info"
                title="Sincronizar Printful"
                aria-label="Sincronizar Printful"
              >
                <Truck className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
            {row.original.status !== 'CANCELLED' && row.original.stripePaymentId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRefund(row.original.id)}
                disabled={processingId === row.original.id}
                className="p-2 text-ink-muted hover:text-danger"
                title="Reembolsar"
                aria-label="Reembolsar"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [processingId]
  )

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      globalFilter: searchTerm,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchTerm,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Pedidos"
        subtitle="Gestiona pedidos, estados y reembolsos"
        icon={Package}
        actions={
          <Button variant="primary" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <label htmlFor="orders-search" className="sr-only">
            Buscar pedidos
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle z-10"
            aria-hidden="true"
          />
          <input
            id="orders-search"
            type="text"
            placeholder="Buscar por ID, email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    const ariaSort = header.column.getCanSort()
                      ? sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                        ? 'descending'
                        : 'none'
                      : undefined
                    return (
                      <th
                        key={header.id}
                        aria-sort={ariaSort}
                        className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-ink-muted">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-ink-muted">
                    No hay pedidos
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-2">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-ink-muted">
            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            de {table.getFilteredRowModel().rows.length} pedidos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 text-ink-muted"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <span className="text-sm text-ink-muted">
              Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 text-ink-muted"
              aria-label="Pagina siguiente"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
