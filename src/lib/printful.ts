import axios from 'axios';
import { Product, ProductVariant } from '@/types/product';

const PRINTFUL_API_URL = 'https://api.printful.com';

// Cliente API para servidor (con autenticación)
const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY || '';
const storeId = process.env.NEXT_PUBLIC_PRINTFUL_STORE_ID || 'ComicStore';

export const printfulApi = axios.create({
  baseURL: PRINTFUL_API_URL,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-PF-Store-Id': storeId,
  },
});

// Tipos para Printful API
export interface PrintfulProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  size: string;
  color: string;
  currency: string;
  is_ignored: boolean;
  sku: string;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: Array<{
    id: number;
    type: string;
    hash: string;
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    dpi: number;
    status: string;
    created: number;
    thumbnail_url: string;
    preview_url: string;
    visible: boolean;
  }>;
}

export interface PrintfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  sync_variants: PrintfulVariant[];
}

// Mapeo de categorías de Printful
const categoryMap: Record<number, string> = {
  24: 'camisetas',
  21: 'sudaderas',
  26: 'tazas',
  178: 'accesorios',
  29: 'posters',
};

// IVA en España
const IVA_RATE = 0.21; // 21%
const ANCHOR_MARGIN = 0.35; // 35% de margen para poder hacer descuentos
const DISCOUNT_PERCENTAGE = 0.25; // 25% de descuento desde el precio ancla

// Calcular precio ancla (precio "original" inflado para mostrar tachado)
function calculateAnchorPrice(basePrice: number): number {
  const priceWithVAT = basePrice * (1 + IVA_RATE);
  const anchorPrice = priceWithVAT * (1 + ANCHOR_MARGIN);

  // Redondear precio ancla a números altos psicológicos
  if (anchorPrice < 15) {
    return Math.ceil(anchorPrice) + 4.99; // Ej: 12.99 → 16.99
  } else if (anchorPrice < 40) {
    const rounded = Math.ceil(anchorPrice / 5) * 5; // Múltiplos de 5
    return rounded + 4.99; // Ej: 25 → 29.99
  } else {
    const rounded = Math.ceil(anchorPrice / 10) * 10; // Múltiplos de 10
    return rounded + 9.99; // Ej: 40 → 49.99
  }
}

// Redondear precio "oferta" (precio real con IVA)
function roundToAttractivePrice(basePrice: number): number {
  const priceWithVAT = basePrice * (1 + IVA_RATE);

  // Redondear a .99, .95, o .00 según el rango
  if (priceWithVAT < 10) {
    return Math.ceil(priceWithVAT) - 0.01; // Ej: 8.99
  } else if (priceWithVAT < 30) {
    return Math.ceil(priceWithVAT) - 0.05; // Ej: 24.95
  } else if (priceWithVAT < 50) {
    const rounded = Math.round(priceWithVAT / 5) * 5;
    return rounded - 0.01; // Ej: 39.99
  } else {
    const rounded = Math.round(priceWithVAT / 10) * 10;
    return rounded === priceWithVAT ? rounded : rounded - 0.01; // Ej: 59.99
  }
}

// Convertir producto de Printful a nuestro formato
function mapPrintfulProduct(printfulProduct: PrintfulSyncProduct): Product {
  const variants: ProductVariant[] = printfulProduct.sync_variants.map((variant) => {
    // Obtener todas las imágenes de preview del variant
    const images = variant.files
      ?.filter(file => file.type === 'preview' || file.type === 'default')
      .map(file => file.preview_url)
      .filter((url): url is string => !!url) || [];

    const basePrice = parseFloat(variant.retail_price) || 0;
    const salePrice = roundToAttractivePrice(basePrice);
    const anchorPrice = calculateAnchorPrice(basePrice);

    return {
      id: variant.id.toString(),
      name: variant.name,
      price: salePrice, // Precio "oferta" redondeado con IVA
      originalPrice: anchorPrice, // Precio "original" inflado para tachar
      sku: variant.sku,
      image: images[0] || variant.product.image,
      images: images.length > 0 ? images : [variant.product.image],
      size: variant.size,
      color: variant.color,
    };
  });

  // Encontrar el precio más bajo entre las variantes
  const lowestSalePrice = variants.length > 0
    ? Math.min(...variants.map(v => v.price))
    : 0;

  const lowestOriginalPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.originalPrice))
    : 0;

  return {
    id: printfulProduct.id.toString(),
    name: printfulProduct.name,
    description: `Producto de alta calidad diseñado con amor.`,
    price: lowestSalePrice,
    originalPrice: lowestOriginalPrice,
    image: printfulProduct.thumbnail_url || variants[0]?.image || '',
    category: categoryMap[Number(printfulProduct.external_id?.split('-')[0])] || 'accesorios',
    variants,
  };
}

// Funciones API
export async function getProducts(): Promise<Product[]> {
  try {
    // Intentar primero obtener productos sincronizados de la tienda
    const response = await printfulApi.get('/store/products');

    console.log('Printful API response:', JSON.stringify(response.data, null, 2));

    // Verificar si hay datos en la respuesta
    if (!response.data || !response.data.result) {
      console.log('No se encontró "result" en la respuesta de Printful');
      return [];
    }

    const printfulProducts: PrintfulSyncProduct[] = response.data.result;

    if (!Array.isArray(printfulProducts) || printfulProducts.length === 0) {
      console.log('No se encontraron productos sincronizados en la tienda');
      return [];
    }

    // Obtener detalles completos de cada producto con variantes
    const productsWithDetails = await Promise.all(
      printfulProducts.map(async (product) => {
        try {
          const detailResponse = await printfulApi.get(`/store/products/${product.id}`);

          if (!detailResponse.data || !detailResponse.data.result) {
            console.error(`No result for product ${product.id}`);
            return null;
          }

          // Combinar sync_product con sync_variants
          const syncProduct = detailResponse.data.result.sync_product;
          const syncVariants = detailResponse.data.result.sync_variants || [];

          return {
            ...syncProduct,
            sync_variants: syncVariants
          };
        } catch (error: any) {
          console.error(`Error fetching product ${product.id}:`, error.message);
          return null;
        }
      })
    );

    const validProducts = productsWithDetails.filter((p): p is PrintfulSyncProduct => p !== null);
    console.log(`Valid products found: ${validProducts.length}`);

    return validProducts.map(mapPrintfulProduct);
  } catch (error: any) {
    console.error('Error fetching products:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await printfulApi.get(`/store/products/${id}`);
    const printfulProduct = response.data.result.sync_product;
    return mapPrintfulProduct(printfulProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Tipos para crear orden en Printful
export interface PrintfulOrderRecipient {
  name: string;
  address1: string;
  city: string;
  country_code: string;
  zip: string;
  email: string;
  phone?: string;
  address2?: string;
  state_code?: string;
}

export interface PrintfulOrderItem {
  sync_variant_id: number;
  quantity: number;
  retail_price?: string;
}

export interface PrintfulOrderRequest {
  recipient: PrintfulOrderRecipient;
  items: PrintfulOrderItem[];
  external_id?: string;
}

export async function createPrintfulOrder(orderData: PrintfulOrderRequest) {
  try {
    console.log('Creating Printful order:', JSON.stringify(orderData, null, 2));

    const response = await printfulApi.post('/orders', orderData);

    console.log('Printful order created:', response.data.result);
    return response.data.result;
  } catch (error: any) {
    console.error('Error creating Printful order:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}
