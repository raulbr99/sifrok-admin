'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import axios from 'axios'

const GELATO_API_URL = 'https://product.gelatoapis.com/v3'

const gelatoProductApi = axios.create({
  baseURL: GELATO_API_URL,
  headers: {
    'X-API-KEY': process.env.GELATO_API_KEY || '',
    'Content-Type': 'application/json',
  },
})

export interface ProductMappingInput {
  localProductId: string
  gelatoProductUid: string
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
      gelatoProductUid: data.gelatoProductUid,
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
 * Obtener precio base de un producto en Gelato
 */
export async function getGelatoProductPrice(productUid: string): Promise<number | null> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  try {
    const response = await gelatoProductApi.get(`/products/${productUid}/prices`, {
      params: {
        country: 'ES',
        currency: 'EUR',
      },
    })

    const prices = response.data
    if (prices?.length > 0) {
      return prices[0].price
    }
    return null
  } catch (error: any) {
    console.error('Error obteniendo precio de Gelato:', error.response?.data || error.message)
    return null
  }
}

/**
 * Sincronizar precios desde Gelato para todos los mapeos
 */
export async function syncPricesFromGelato() {
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
    try {
      const price = await getGelatoProductPrice(mapping.gelatoProductUid)
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

