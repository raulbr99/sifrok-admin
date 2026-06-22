'use client'

import { useState, useEffect } from 'react'
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Save,
} from 'lucide-react'
import {
  getProductMappings,
  createProductMapping,
  updateProductMapping,
  deleteProductMapping,
} from '@/actions/products'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'

// Utility function to calculate margin
function calculateMargin(basePrice: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  return ((salePrice - basePrice) / salePrice) * 100
}

interface ProductMappingForm {
  localProductId: string
  printfulSyncVariantId?: number
  productName: string
  basePrice: number
  salePrice: number
  category?: string
  placements?: string
}

interface ProductMapping {
  id: string
  localProductId: string
  printfulSyncVariantId: number | null
  productName: string
  basePrice: number
  salePrice: number
  category: string | null
  createdAt: Date
}

const EMPTY_FORM: ProductMappingForm = {
  localProductId: '',
  printfulSyncVariantId: undefined,
  productName: '',
  basePrice: 0,
  salePrice: 0,
  category: '',
}

export default function ProductsPage() {
  const [mappings, setMappings] = useState<ProductMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ProductMappingForm>(EMPTY_FORM)
  const { toast } = useToast()
  const confirm = useConfirm()

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

  async function handleSave() {
    try {
      if (editingId) {
        await updateProductMapping(editingId, formData)
        toast.success('Mapeo guardado.')
      } else {
        await createProductMapping(formData)
        toast.success('Mapeo creado.')
      }
      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadMappings()
    } catch (error: any) {
      toast.error('No se pudo guardar el mapeo. Inténtalo de nuevo.')
    }
  }

  async function handleDelete(id: string) {
    const mapping = mappings.find((m) => m.id === id)
    if (
      !(await confirm({
        title: mapping ? `¿Eliminar "${mapping.productName}"?` : '¿Eliminar este mapeo?',
        message: 'Se eliminará el mapeo con Printful. Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        tone: 'danger',
      }))
    ) {
      return
    }

    try {
      await deleteProductMapping(id)
      toast.success('Mapeo eliminado.')
      loadMappings()
    } catch (error: any) {
      toast.error('No se pudo eliminar el mapeo. Inténtalo de nuevo.')
    }
  }

  function handleEdit(mapping: ProductMapping) {
    setFormData({
      localProductId: mapping.localProductId,
      printfulSyncVariantId: mapping.printfulSyncVariantId ?? undefined,
      productName: mapping.productName,
      basePrice: mapping.basePrice,
      salePrice: mapping.salePrice,
      category: mapping.category || '',
    })
    setEditingId(mapping.id)
    setShowForm(true)
  }

  function resetForm() {
    setFormData(EMPTY_FORM)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tags className="w-8 h-8 text-purple-600" aria-hidden="true" />
            Mapeo de Productos
          </h1>
          <p className="text-gray-500 mt-1">Conecta tus productos locales con Printful</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm()
              setEditingId(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo Mapeo
          </button>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar Mapeo' : 'Nuevo Mapeo'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto
            </label>
            <input
              id="product-name"
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Camiseta Basica Blanca"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-local-id" className="block text-sm font-medium text-gray-700 mb-1">
                ID Local
              </label>
              <input
                id="product-local-id"
                type="text"
                value={formData.localProductId}
                onChange={(e) => setFormData({ ...formData, localProductId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="prod_123"
              />
            </div>
            <div>
              <label htmlFor="product-variant-id" className="block text-sm font-medium text-gray-700 mb-1">
                Printful Sync Variant ID
              </label>
              <input
                id="product-variant-id"
                type="number"
                value={formData.printfulSyncVariantId ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printfulSyncVariantId:
                      e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="4567890123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-base-price" className="block text-sm font-medium text-gray-700 mb-1">
                Precio Base (Coste Printful)
              </label>
              <input
                id="product-base-price"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="12.00"
              />
            </div>
            <div>
              <label htmlFor="product-sale-price" className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta
              </label>
              <input
                id="product-sale-price"
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
            <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria (opcional)
            </label>
            <input
              id="product-category"
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
            type="button"
            onClick={() => {
              setShowForm(false)
              setEditingId(null)
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Guardar
          </button>
        </div>
      </Modal>

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
                Printful Variant ID
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
                      {mapping.printfulSyncVariantId != null ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {mapping.printfulSyncVariantId}
                        </code>
                      ) : (
                        <span className="text-xs text-gray-600">Sin sincronizar</span>
                      )}
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
                          type="button"
                          onClick={() => handleEdit(mapping)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          aria-label={`Editar ${mapping.productName}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(mapping.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          aria-label={`Eliminar ${mapping.productName}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
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
