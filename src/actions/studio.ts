'use server'

import { auth } from '@/lib/auth'
import axios from 'axios'

export interface ValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  dimensions?: {
    width: number
    height: number
    estimatedDPI: number
  }
}

// Dimensiones minimas por tipo de placement (en pixeles)
// Asumiendo 300 DPI para calidad de impresion
const MIN_DIMENSIONS: Record<string, { width: number; height: number }> = {
  'front-center': { width: 3000, height: 3000 },  // ~10" x 10" @ 300 DPI
  'front-left': { width: 1200, height: 1200 },    // ~4" x 4" @ 300 DPI
  'back-full': { width: 3600, height: 4200 },     // ~12" x 14" @ 300 DPI
  'back-neck': { width: 1200, height: 600 },      // ~4" x 2" @ 300 DPI
  'sleeve-left': { width: 1200, height: 1500 },   // ~4" x 5" @ 300 DPI
  'sleeve-right': { width: 1200, height: 1500 },  // ~4" x 5" @ 300 DPI
  default: { width: 2400, height: 2400 },         // ~8" x 8" @ 300 DPI
}

/**
 * Verificar accesibilidad de una URL de imagen
 */
export async function checkImageAccessibility(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status < 400,
    })
    return response.status === 200
  } catch {
    return false
  }
}

/**
 * Validar imagen para impresion (server-side check)
 * Nota: La validacion de dimensiones debe hacerse en el cliente con canvas
 */
export async function validateImageForPrint(
  imageUrl: string,
  placement: string = 'default'
): Promise<ValidationResult> {
  const session = await auth()
  if (!session) {
    throw new Error('No autenticado')
  }

  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  }

  // 1. Verificar accesibilidad de la URL
  const isAccessible = await checkImageAccessibility(imageUrl)
  if (!isAccessible) {
    result.errors.push('La imagen no es accesible desde el servidor')
    result.isValid = false
    return result
  }

  // 2. Verificar que sea una URL valida para Gelato
  // Gelato necesita URLs publicas y permanentes
  if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
    result.errors.push('La URL de imagen debe ser publica (no localhost)')
    result.isValid = false
  }

  // 3. Verificar protocolo HTTPS (recomendado para Gelato)
  if (!imageUrl.startsWith('https://')) {
    result.warnings.push('Se recomienda usar URLs HTTPS para mejor compatibilidad')
  }

  // 4. Verificar que no sea una URL temporal
  const temporaryDomains = ['replicate.delivery', 'blob:', 'data:']
  for (const domain of temporaryDomains) {
    if (imageUrl.includes(domain)) {
      result.warnings.push(
        `La imagen parece ser temporal (${domain}). Asegurate de subirla a un hosting permanente como Imgur`
      )
    }
  }

  // 5. Verificar tipo de archivo por extension
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp']
  const hasValidExtension = validExtensions.some((ext) =>
    imageUrl.toLowerCase().includes(ext)
  )
  if (!hasValidExtension && !imageUrl.includes('imgur')) {
    result.warnings.push('No se puede determinar el formato de imagen. Se recomiendan PNG o JPG')
  }

  return result
}

/**
 * Obtener dimensiones minimas para un placement
 */
export async function getMinDimensionsForPlacement(
  placement: string
): Promise<{ width: number; height: number; dpi: number }> {
  const session = await auth()
  if (!session) {
    throw new Error('No autenticado')
  }

  const dims = MIN_DIMENSIONS[placement] || MIN_DIMENSIONS.default
  return {
    ...dims,
    dpi: 300,
  }
}

/**
 * Validar coleccion completa antes de enviar a produccion
 */
export async function validateCollectionForProduction(
  designs: Array<{ imageUrl: string; placement: string }>
): Promise<{
  isValid: boolean
  results: Array<{ placement: string; validation: ValidationResult }>
}> {
  const session = await auth()
  if (!session) {
    throw new Error('No autenticado')
  }

  const results = await Promise.all(
    designs.map(async (design) => ({
      placement: design.placement,
      validation: await validateImageForPrint(design.imageUrl, design.placement),
    }))
  )

  const isValid = results.every((r) => r.validation.isValid)

  return { isValid, results }
}

/**
 * Verificar que las dimensiones de imagen cumplan con los requisitos
 * Esta funcion es para uso en el cliente, retorna las dimensiones minimas
 */
export async function getValidationRequirements(placement: string) {
  const session = await auth()
  if (!session) {
    throw new Error('No autenticado')
  }

  const minDims = MIN_DIMENSIONS[placement] || MIN_DIMENSIONS.default

  return {
    minWidth: minDims.width,
    minHeight: minDims.height,
    recommendedDPI: 300,
    acceptedFormats: ['PNG', 'JPG', 'JPEG', 'WebP'],
    maxFileSizeMB: 25,
    notes: [
      'PNG con fondo transparente es ideal para disenos',
      'Minimo 300 DPI para calidad de impresion optima',
      'Colores en modo RGB',
    ],
  }
}
