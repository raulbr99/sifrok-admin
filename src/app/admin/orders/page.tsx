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
import { syncGelatoOrderStatus } from '@/actions/gelato'

interface Order {
  id: string
  userId: string
  stripeSessionId: string
  stripePaymentId: string | null
  total: number
  currency: string
  status: string
  gelatoOrderId: string | null
  gelatoStatus: string | null
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

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED: 'bg-gray-100 text-gray-800',
}

const gelatoStatusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-800',
  passed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

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
    if (!confirm('Estas seguro de procesar el reembolso? Esta accion no se puede deshacer.')) {
      return
    }

    setProcessingId(orderId)
    try {
      const result = await processRefund(orderId)
      if (result.success) {
        alert(`Reembolso procesado: ${result.amount} EUR`)
        loadOrders()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleSyncGelato(orderId: string) {
    setProcessingId(orderId)
    try {
      await syncGelatoOrderStatus(orderId)
      loadOrders()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCalculateProfit(orderId: string) {
    setProcessingId(orderId)
    try {
      const profit = await calculateOrderProfit(orderId)
      alert(`Profit calculado: ${profit.netProfit.toFixed(2)} EUR (Margen: ${profit.margin.toFixed(1)}%)`)
      loadOrders()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
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
            <p className="text-xs text-gray-500">{row.original.user.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total
            <ArrowUpDown className="w-4 h-4" />
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
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[row.original.status] || 'bg-gray-100'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'gelatoStatus',
        header: 'Estado Gelato',
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              gelatoStatusColors[row.original.gelatoStatus || ''] || 'bg-gray-100 text-gray-500'
            }`}
          >
            {row.original.gelatoStatus || 'No enviado'}
          </span>
        ),
      },
      {
        accessorKey: 'netProfit',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profit
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) => {
          const profit = row.original.netProfit
          if (profit === null) {
            return <span className="text-gray-400 text-xs">Sin calcular</span>
          }
          return (
            <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit.toFixed(2)} EUR
            </span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Fecha
            <ArrowUpDown className="w-4 h-4" />
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
            <button
              onClick={() => handleCalculateProfit(row.original.id)}
              disabled={processingId === row.original.id}
              className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
              title="Calcular profit"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            {row.original.gelatoOrderId && (
              <button
                onClick={() => handleSyncGelato(row.original.id)}
                disabled={processingId === row.original.id}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Sincronizar Gelato"
              >
                <Truck className="w-4 h-4" />
              </button>
            )}
            {row.original.status !== 'CANCELLED' && row.original.stripePaymentId && (
              <button
                onClick={() => handleRefund(row.original.id)}
                disabled={processingId === row.original.id}
                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                title="Reembolsar"
              >
                <XCircle className="w-4 h-4" />
              </button>
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            Pedidos
          </h1>
          <p className="text-gray-500 mt-1">Gestiona pedidos, estados y reembolsos</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID, email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    No hay pedidos
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            de {table.getFilteredRowModel().rows.length} pedidos
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
