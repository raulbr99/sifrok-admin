'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { printfulApi } from '@/lib/printful'
import { revalidatePath } from 'next/cache'

export interface ProductMappingInput {
  localProductId: string
  printfulSyncVariantId?: number
  productName: string
  basePrice: number
  salePrice: number
  category?: string
  placements?: string
}

/**
 * Obtener todos los mapeos de productos
 */
export async function getProductMappings() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  return prisma.productMapping.findMany({
    orderBy: { productName: 'asc' },
  })
}

/**
 * Obtener un mapeo por ID local
 */
export async function getProductMappingByLocalId(localProductId: string) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  return prisma.productMapping.findUnique({
    where: { localProductId },
  })
}

/**
 * Crear un nuevo mapeo de producto
 */
export async function createProductMapping(data: ProductMappingInput) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const mapping = await prisma.productMapping.create({
    data: {
      localProductId: data.localProductId,
      printfulSyncVariantId: data.printfulSyncVariantId ?? null,
      productName: data.productName,
      basePrice: data.basePrice,
      salePrice: data.salePrice,
      category: data.category,
      placements: data.placements,
    },
  })

  revalidatePath('/admin/products')
  return mapping
}

/**
 * Actualizar un mapeo de producto
 */
export async function updateProductMapping(
  id: string,
  data: Partial<ProductMappingInput>
) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const mapping = await prisma.productMapping.update({
    where: { id },
    data,
  })

  revalidatePath('/admin/products')
  return mapping
}

/**
 * Eliminar un mapeo de producto
 */
export async function deleteProductMapping(id: string) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  await prisma.productMapping.delete({
    where: { id },
  })

  revalidatePath('/admin/products')
}

/**
 * Obtener precio de venta de una sync variant en Printful
 */
export async function getPrintfulVariantPrice(
  syncVariantId: number
): Promise<number | null> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  try {
    const response = await printfulApi.get(`/store/variants/${syncVariantId}`)
    const variant = response.data?.result
    const retailPrice = variant?.retail_price
    if (retailPrice != null) {
      const parsed = parseFloat(retailPrice)
      return Number.isNaN(parsed) ? null : parsed
    }
    return null
  } catch (error: any) {
    console.error(
      'Error obteniendo precio de Printful:',
      error.response?.data || error.message
    )
    return null
  }
}

/**
 * Sincronizar precios desde Printful para todos los mapeos
 */
export async function syncPricesFromPrintful() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const mappings = await prisma.productMapping.findMany()
  const results = {
    updated: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const mapping of mappings) {
    if (mapping.printfulSyncVariantId == null) {
      results.failed++
      results.errors.push(`${mapping.productName} no tiene sync variant de Printful`)
      continue
    }

    try {
      const price = await getPrintfulVariantPrice(mapping.printfulSyncVariantId)
      if (price !== null) {
        await prisma.productMapping.update({
          where: { id: mapping.id },
          data: { basePrice: price },
        })
        results.updated++
      } else {
        results.failed++
        results.errors.push(`No se pudo obtener precio para ${mapping.productName}`)
      }
    } catch (error: any) {
      results.failed++
      results.errors.push(`Error en ${mapping.productName}: ${error.message}`)
    }
  }

  revalidatePath('/admin/products')
  return results
}

export interface PrintfulSyncVariantOption {
  syncVariantId: number
  productName: string
  variantName: string
  size?: string
  color?: string
  retailPrice?: string
  thumbnail?: string
}

/**
 * Lista las variantes sincronizadas en la tienda de Printful, para elegir el
 * sync_variant_id al crear/editar un ProductMapping (poblar printfulSyncVariantId).
 */
export async function listPrintfulSyncVariants(): Promise<PrintfulSyncVariantOption[]> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const list = await printfulApi.get('/store/products')
  const products: any[] = (list.data?.result || []).slice(0, 50)
  const out: PrintfulSyncVariantOption[] = []

  for (const p of products) {
    try {
      const detail = await printfulApi.get(`/store/products/${p.id}`)
      const variants: any[] = detail.data?.result?.sync_variants || []
      for (const v of variants) {
        out.push({
          syncVariantId: v.id,
          productName: p.name,
          variantName: v.name,
          size: v.size,
          color: v.color,
          retailPrice: v.retail_price,
          thumbnail: v.product?.image || p.thumbnail_url,
        })
      }
    } catch {
      // ignora un producto que falle, sigue con los demás
    }
  }

  return out
}

export interface SyncMappingsResult {
  created: number
  updated: number
  total: number
  errors: string[]
}

/**
 * Importa TODAS las variantes sincronizadas de Printful y crea/actualiza los
 * ProductMapping en bloque. Clave: localProductId = external_id de Printful (o
 * `printful-{syncVariantId}` si no hay). Rellena printfulSyncVariantId y, al crear,
 * usa retail_price como precio inicial. Al actualizar NO toca precios (los ajusta
 * el admin), solo refresca nombre + sync_variant_id. Idempotente (re-ejecutable).
 */
export async function syncProductMappingsFromPrintful(): Promise<SyncMappingsResult> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const res: SyncMappingsResult = { created: 0, updated: 0, total: 0, errors: [] }
  const list = await printfulApi.get('/store/products')
  const products: any[] = (list.data?.result || []).slice(0, 100)

  for (const p of products) {
    try {
      const detail = await printfulApi.get(`/store/products/${p.id}`)
      const variants: any[] = detail.data?.result?.sync_variants || []
      for (const v of variants) {
        res.total++
        const localProductId = (v.external_id && String(v.external_id)) || `printful-${v.id}`
        const price = parseFloat(v.retail_price) || 0
        const productName = `${p.name} - ${v.name}`.slice(0, 200)
        const existing = await prisma.productMapping.findUnique({ where: { localProductId } })
        if (existing) {
          await prisma.productMapping.update({
            where: { localProductId },
            data: { printfulSyncVariantId: v.id, productName },
          })
          res.updated++
        } else {
          await prisma.productMapping.create({
            data: { localProductId, printfulSyncVariantId: v.id, productName, basePrice: price, salePrice: price },
          })
          res.created++
        }
      }
    } catch (e: any) {
      res.errors.push(`${p.name}: ${e.message}`)
    }
  }

  revalidatePath('/admin/products')
  return res
}
