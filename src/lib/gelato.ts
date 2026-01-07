import axios from 'axios';
import { Product, ProductVariant } from '@/types/product';

const GELATO_API_URL = 'https://ecommerce.gelatoapis.com/v1';
const GELATO_ORDER_API_URL = 'https://order.gelatoapis.com/v4';
const GELATO_PRODUCT_API_URL = 'https://product.gelatoapis.com/v3';

// Cliente API para Gelato
const apiKey = process.env.GELATO_API_KEY || '';
const storeId = process.env.GELATO_STORE_ID || '';

export const gelatoApi = axios.create({
  baseURL: GELATO_API_URL,
  headers: {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
  },
});

export const gelatoOrderApi = axios.create({
  baseURL: GELATO_ORDER_API_URL,
  headers: {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
  },
});

export const gelatoProductApi = axios.create({
  baseURL: GELATO_PRODUCT_API_URL,
  headers: {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
  },
});

// IVA en España
const IVA_RATE = 0.21; // 21%
const ANCHOR_MARGIN = 0.35; // 35% de margen para poder hacer descuentos

// Calcular precio ancla (precio "original" inflado para mostrar tachado)
function calculateAnchorPrice(basePrice: number): number {
  const priceWithVAT = basePrice * (1 + IVA_RATE);
  const anchorPrice = priceWithVAT * (1 + ANCHOR_MARGIN);

  if (anchorPrice < 15) {
    return Math.ceil(anchorPrice) + 4.99;
  } else if (anchorPrice < 40) {
    const rounded = Math.ceil(anchorPrice / 5) * 5;
    return rounded + 4.99;
  } else {
    const rounded = Math.ceil(anchorPrice / 10) * 10;
    return rounded + 9.99;
  }
}

// Redondear precio "oferta" (precio real con IVA)
function roundToAttractivePrice(basePrice: number): number {
  const priceWithVAT = basePrice * (1 + IVA_RATE);

  if (priceWithVAT < 10) {
    return Math.ceil(priceWithVAT) - 0.01;
  } else if (priceWithVAT < 30) {
    return Math.ceil(priceWithVAT) - 0.05;
  } else if (priceWithVAT < 50) {
    const rounded = Math.round(priceWithVAT / 5) * 5;
    return rounded - 0.01;
  } else {
    const rounded = Math.round(priceWithVAT / 10) * 10;
    return rounded === priceWithVAT ? rounded : rounded - 0.01;
  }
}

// Mapeo de categorías
const categoryMap: Record<string, string> = {
  'apparel': 'camisetas',
  'hoodies': 'sudaderas',
  'mugs': 'tazas',
  'accessories': 'accesorios',
  'posters': 'posters',
  'home-living': 'hogar',
};

// Tipos de Gelato API
export interface GelatoProduct {
  uid: string;
  title: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  images: Array<{
    url: string;
  }>;
  variants: GelatoVariant[];
}

export interface GelatoVariant {
  uid: string;
  title: string;
  sku: string;
  price: {
    amount: number;
    currency: string;
  };
  attributes: {
    size?: string;
    color?: string;
  };
  previewUrl?: string;
}

// Obtener precio de un productUid
async function getProductPrice(productUid: string): Promise<number> {
  try {
    const response = await gelatoProductApi.get(`/products/${productUid}/prices`);

    // La respuesta contiene precios por cantidad, tomamos el precio de cantidad 1
    const prices = response.data;
    if (prices && prices.length > 0) {
      // Buscar el precio para cantidad 1
      const price1 = prices.find((p: any) => p.quantity === 1);
      if (price1 && price1.price) {
        return parseFloat(price1.price);
      }
    }

    // Si no hay precio, usar precio por defecto
    return 20;
  } catch (error) {
    console.warn(`⚠️ No se pudo obtener precio para ${productUid}, usando precio por defecto`);
    return 20;
  }
}

// Convertir producto de Gelato a nuestro formato
async function mapGelatoProduct(gelatoProduct: any): Promise<Product> {
  const variants: ProductVariant[] = await Promise.all(
    gelatoProduct.variants?.map(async (variant: any) => {
      // Obtener precio real de la API
      const basePrice = await getProductPrice(variant.productUid);
      const salePrice = roundToAttractivePrice(basePrice);
      const anchorPrice = calculateAnchorPrice(basePrice);

      // Extraer talla y color del título
      const titleParts = variant.title.split(' - ');
      const color = titleParts[0] || 'White';
      const size = titleParts[1] || 'M';

      return {
        id: variant.id,
        name: variant.title,
        price: salePrice,
        originalPrice: anchorPrice,
        sku: variant.productUid,
        image: gelatoProduct.previewUrl || '',
        images: [gelatoProduct.previewUrl || ''],
        size: size,
        color: color,
      };
    }) || []
  );

  const lowestSalePrice = variants.length > 0
    ? Math.min(...variants.map(v => v.price))
    : 0;

  const lowestOriginalPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.originalPrice))
    : 0;

  // Determinar categoría del título
  let category = 'accesorios';
  const titleLower = gelatoProduct.title.toLowerCase();
  if (titleLower.includes('hoodie') || titleLower.includes('sudadera')) {
    category = 'sudaderas';
  } else if (titleLower.includes('shirt') || titleLower.includes('camiseta') || titleLower.includes('t-shirt')) {
    category = 'camisetas';
  } else if (titleLower.includes('mug') || titleLower.includes('taza')) {
    category = 'tazas';
  } else if (titleLower.includes('poster')) {
    category = 'posters';
  }

  return {
    id: gelatoProduct.id,
    name: gelatoProduct.title,
    description: gelatoProduct.description || 'Producto de alta calidad con impresión personalizada.',
    price: lowestSalePrice,
    originalPrice: lowestOriginalPrice,
    image: gelatoProduct.previewUrl || '',
    category: category,
    variants,
  };
}

// Funciones API
export async function getProducts(): Promise<Product[]> {
  try {
    console.log('🔄 Obteniendo productos de Gelato...');
    console.log('🔑 API Key configurada:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO CONFIGURADA');
    console.log('🏪 Store ID:', storeId || 'NO CONFIGURADO');

    if (!apiKey || !storeId) {
      console.error('❌ GELATO_API_KEY o GELATO_STORE_ID no están configurados');
      return [];
    }

    const response = await gelatoApi.get(`/stores/${storeId}/products`);

    console.log('📦 Respuesta de Gelato API:', JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.products) {
      console.log('⚠️ No se encontraron productos en la respuesta de Gelato');
      return [];
    }

    const gelatoProducts: GelatoProduct[] = response.data.products;

    if (!Array.isArray(gelatoProducts) || gelatoProducts.length === 0) {
      console.log('⚠️ No hay productos disponibles en Gelato');
      return [];
    }

    console.log(`✅ Productos encontrados en Gelato: ${gelatoProducts.length}`);

    // Mapear productos con precios de la API (async)
    const products = await Promise.all(gelatoProducts.map(mapGelatoProduct));
    return products;
  } catch (error: any) {
    console.error('❌ Error obteniendo productos de Gelato:', error.message);
    if (error.response) {
      console.error('📄 Respuesta de error:', error.response.data);
      console.error('🔢 Status:', error.response.status);
    }
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await gelatoApi.get(`/stores/${storeId}/products/${id}`);
    const gelatoProduct = response.data.product;
    return mapGelatoProduct(gelatoProduct);
  } catch (error) {
    console.error('Error fetching product from Gelato:', error);
    return null;
  }
}

// Tipos para crear orden en Gelato
export interface GelatoOrderRecipient {
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  country: string; // ISO 3166-1 alpha-2 (ej: "ES")
  postCode: string;
  email: string;
  phone?: string;
  addressLine2?: string;
  state?: string;
}

export interface GelatoOrderItem {
  itemReferenceId: string;
  productUid: string;
  quantity: number;
  files?: Array<{
    type: 'default';
    url: string;
  }>;
}

export interface GelatoOrderRequest {
  orderType: 'order' | 'draft';
  orderReferenceId: string;
  customerReferenceId?: string;
  currency: string;
  items: GelatoOrderItem[];
  shipmentMethodUid?: string; // 'standard' | 'express'
  shippingAddress: GelatoOrderRecipient;
}

export async function createGelatoOrder(orderData: GelatoOrderRequest) {
  try {
    console.log('📦 Creando orden en Gelato:', JSON.stringify(orderData, null, 2));

    const response = await gelatoOrderApi.post('/orders', orderData);

    console.log('✅ Orden creada en Gelato:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creando orden en Gelato:', error.message);
    if (error.response) {
      console.error('📄 Respuesta de error:', error.response.data);
      console.error('🔢 Status:', error.response.status);
    }
    throw error;
  }
}
