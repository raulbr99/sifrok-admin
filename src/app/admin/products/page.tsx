'use client'

import { useState, useEffect } from 'react'
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  X,
} from 'lucide-react'
import {
  getProductMappings,
  createProductMapping,
  updateProductMapping,
  deleteProductMapping,
  syncPricesFromGelato,
  type ProductMappingInput,
} from '@/actions/products'

// Utility function to calculate margin
function calculateMargin(basePrice: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  return ((salePrice - basePrice) / salePrice) * 100
}

interface ProductMapping {
  id: string
  localProductId: string
  gelatoProductUid: string
  productName: string
  basePrice: number
  salePrice: number
  category: string | null
  createdAt: Date
}

export default function ProductsPage() {
  const [mappings, setMappings] = useState<ProductMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ProductMappingInput>({
    localProductId: '',
    gelatoProductUid: '',
    productName: '',
    basePrice: 0,
    salePrice: 0,
    category: '',
  })

  useEffect(() => {
    loadMappings()
  }, [])

  async function loadMappings() {
    setLoading(true)
    try {
      const data = await getProductMappings()
      setMappings(data as ProductMapping[])
    } catch (error) {
      console.error('Error loading mappings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await syncPricesFromGelato()
      alert(`Sincronizacion completada: ${result.updated} actualizados, ${result.failed} fallidos`)
      loadMappings()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  async function handleSave() {
    try {
      if (editingId) {
        await updateProductMapping(editingId, formData)
      } else {
        await createProductMapping(formData)
      }
      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadMappings()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Estas seguro de eliminar este mapeo?')) return

    try {
      await deleteProductMapping(id)
      loadMappings()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  function handleEdit(mapping: ProductMapping) {
    setFormData({
      localProductId: mapping.localProductId,
      gelatoProductUid: mapping.gelatoProductUid,
      productName: mapping.productName,
      basePrice: mapping.basePrice,
      salePrice: mapping.salePrice,
      category: mapping.category || '',
    })
    setEditingId(mapping.id)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      localProductId: '',
      gelatoProductUid: '',
      productName: '',
      basePrice: 0,
      salePrice: 0,
      category: '',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tags className="w-8 h-8 text-purple-600" />
            Mapeo de Productos
          </h1>
          <p className="text-gray-500 mt-1">Conecta tus productos locales con Gelato</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Precios
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingId(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Mapeo
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Mapeo' : 'Nuevo Mapeo'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Camiseta Basica Blanca"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Local
                  </label>
                  <input
                    type="text"
                    value={formData.localProductId}
                    onChange={(e) => setFormData({ ...formData, localProductId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="prod_123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gelato Product UID
                  </label>
                  <input
                    type="text"
                    value={formData.gelatoProductUid}
                    onChange={(e) => setFormData({ ...formData, gelatoProductUid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="apparel_product_gca_..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Base (Coste Gelato)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="12.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de Venta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="29.99"
                  />
                </div>
              </div>

              {formData.basePrice > 0 && formData.salePrice > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Margen estimado:{' '}
                    <span className={`font-semibold ${calculateMargin(formData.basePrice, formData.salePrice) >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                      {calculateMargin(formData.basePrice, formData.salePrice).toFixed(1)}%
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria (opcional)
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="camisetas"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                ID Local
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Gelato UID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Coste
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Venta
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Margen
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Cargando productos...
                </td>
              </tr>
            ) : mappings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay mapeos de productos. Crea uno para empezar.
                </td>
              </tr>
            ) : (
              mappings.map((mapping) => {
                const margin = calculateMargin(mapping.basePrice, mapping.salePrice)
                return (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{mapping.productName}</p>
                        {mapping.category && (
                          <p className="text-xs text-gray-500">{mapping.category}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {mapping.localProductId}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {mapping.gelatoProductUid.slice(0, 20)}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {mapping.basePrice.toFixed(2)} EUR
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {mapping.salePrice.toFixed(2)} EUR
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          margin >= 30
                            ? 'bg-green-100 text-green-800'
                            : margin >= 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
