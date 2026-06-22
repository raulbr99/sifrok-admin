'use client'

import { useState, useEffect } from 'react'
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Save,
  Search,
} from 'lucide-react'
import {
  getProductMappings,
  createProductMapping,
  updateProductMapping,
  deleteProductMapping,
  listPrintfulSyncVariants,
  type PrintfulSyncVariantOption,
} from '@/actions/products'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import Field, { inputClass } from '@/components/ui/Field'

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
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [variants, setVariants] = useState<PrintfulSyncVariantOption[]>([])
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

  async function handleOpenVariantPicker() {
    setShowVariantPicker(true)
    setVariantsLoading(true)
    try {
      const data = await listPrintfulSyncVariants()
      setVariants(data)
    } catch (error) {
      console.error('Error loading Printful variants:', error)
      toast.error('No se pudieron cargar las variantes de Printful.')
      setShowVariantPicker(false)
    } finally {
      setVariantsLoading(false)
    }
  }

  function handleSelectVariant(option: PrintfulSyncVariantOption) {
    setFormData((prev) => {
      const next: ProductMappingForm = {
        ...prev,
        printfulSyncVariantId: option.syncVariantId,
      }
      if (!prev.productName.trim()) {
        next.productName = `${option.productName} ${option.variantName}`.trim()
      }
      if (!prev.basePrice && option.retailPrice) {
        const parsed = parseFloat(option.retailPrice)
        if (!Number.isNaN(parsed)) next.basePrice = parsed
      }
      return next
    })
    setShowVariantPicker(false)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Mapeo de Productos"
        subtitle="Conecta tus productos locales con Printful"
        icon={Tags}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              resetForm()
              setEditingId(null)
              setShowForm(true)
            }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo Mapeo
          </Button>
        }
      />

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
          <Field label="Nombre del Producto" htmlFor="product-name">
            <input
              id="product-name"
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className={inputClass}
              placeholder="Camiseta Basica Blanca"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="ID Local" htmlFor="product-local-id">
              <input
                id="product-local-id"
                type="text"
                value={formData.localProductId}
                onChange={(e) => setFormData({ ...formData, localProductId: e.target.value })}
                className={inputClass}
                placeholder="prod_123"
              />
            </Field>
            <Field label="Printful Sync Variant ID" htmlFor="product-variant-id">
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
                className={inputClass}
                placeholder="4567890123"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenVariantPicker}
                className="mt-2 w-full"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                Elegir variante de Printful
              </Button>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio Base (Coste Printful)" htmlFor="product-base-price">
              <input
                id="product-base-price"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="12.00"
              />
            </Field>
            <Field label="Precio de Venta" htmlFor="product-sale-price">
              <input
                id="product-sale-price"
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="29.99"
              />
            </Field>
          </div>

          {formData.basePrice > 0 && formData.salePrice > 0 && (
            <div className="p-3 bg-surface-2 rounded-card">
              <p className="text-sm text-ink-muted">
                Margen estimado:{' '}
                <span className={`font-semibold ${calculateMargin(formData.basePrice, formData.salePrice) >= 30 ? 'text-success' : 'text-warning'}`}>
                  {calculateMargin(formData.basePrice, formData.salePrice).toFixed(1)}%
                </span>
              </p>
            </div>
          )}

          <Field label="Categoria (opcional)" htmlFor="product-category">
            <input
              id="product-category"
              type="text"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
              placeholder="camisetas"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowForm(false)
              setEditingId(null)
            }}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save className="w-4 h-4" aria-hidden="true" />
            Guardar
          </Button>
        </div>
      </Modal>

      {/* Printful Variant Picker Modal */}
      <Modal
        open={showVariantPicker}
        onClose={() => setShowVariantPicker(false)}
        title="Elegir variante de Printful"
        description="Selecciona una variante sincronizada para rellenar el Sync Variant ID."
        size="lg"
      >
        {variantsLoading ? (
          <div className="px-4 py-8 text-center text-ink-muted" role="status" aria-live="polite">
            Cargando variantes de Printful...
          </div>
        ) : variants.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink-muted">
            No hay variantes sincronizadas en Printful.
          </div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {variants.map((option) => {
              const meta = [option.size, option.color].filter(Boolean).join(' / ')
              return (
                <li key={option.syncVariantId}>
                  <button
                    type="button"
                    onClick={() => handleSelectVariant(option)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {option.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={option.thumbnail}
                        alt=""
                        className="h-12 w-12 flex-shrink-0 rounded-card object-cover bg-surface-2"
                      />
                    ) : (
                      <div className="h-12 w-12 flex-shrink-0 rounded-card bg-surface-2" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{option.productName}</p>
                      <p className="text-sm text-ink-muted truncate">
                        {option.variantName}
                        {meta && <span className="text-ink-muted"> · {meta}</span>}
                      </p>
                    </div>
                    {option.retailPrice && (
                      <span className="flex-shrink-0 text-sm font-medium text-ink">
                        {option.retailPrice} EUR
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Modal>

      {/* Table */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                ID Local
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Printful Variant ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Coste
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Venta
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Margen
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-ink-muted"
                  role="status"
                  aria-live="polite"
                >
                  Cargando productos...
                </td>
              </tr>
            ) : mappings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                  No hay mapeos de productos. Crea uno para empezar.
                </td>
              </tr>
            ) : (
              mappings.map((mapping) => {
                const margin = calculateMargin(mapping.basePrice, mapping.salePrice)
                return (
                  <tr key={mapping.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <div className="min-w-0 max-w-[16rem]">
                        <p className="font-medium text-ink truncate">{mapping.productName}</p>
                        {mapping.category && (
                          <p className="text-xs text-ink-muted truncate">{mapping.category}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-surface-2 text-ink-muted px-2 py-1 rounded-card">
                        {mapping.localProductId}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {mapping.printfulSyncVariantId != null ? (
                        <code className="text-xs bg-surface-2 text-ink-muted px-2 py-1 rounded-card">
                          {mapping.printfulSyncVariantId}
                        </code>
                      ) : (
                        <span className="text-xs text-ink-muted">Sin sincronizar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {mapping.basePrice.toFixed(2)} EUR
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {mapping.salePrice.toFixed(2)} EUR
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={margin >= 30 ? 'success' : margin >= 20 ? 'warning' : 'danger'}>
                        {margin.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mapping)}
                          className="p-2 text-ink-muted hover:text-info"
                          aria-label={`Editar ${mapping.productName}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(mapping.id)}
                          className="p-2 text-ink-muted hover:text-danger"
                          aria-label={`Eliminar ${mapping.productName}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
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
    </div>
  )
}
