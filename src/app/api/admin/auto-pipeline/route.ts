import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { gelatoApi } from '@/lib/gelato';
import { generateImageWithOpenRouter, uploadToImgur } from '@/lib/openrouter';

const storeId = process.env.GELATO_STORE_ID || '';

// Mapeo de tallas a códigos Gelato
const SIZE_CODES: Record<string, string> = {
  'XS': 'xs',
  'S': 's',
  'M': 'm',
  'L': 'l',
  'XL': 'xl',
  '2XL': '2xl',
  '3XL': '3xl',
};

// Mapeo de colores a códigos Gelato
const COLOR_CODES: Record<string, string> = {
  'white': 'white',
  'black': 'black',
  'navy': 'navy',
  'red': 'red',
  'gray': 'sport-grey',
  'green': 'irish-green',
};

// Tipos de productos disponibles en Gelato
const PRODUCT_TEMPLATES = {
  tshirt: {
    name: 'Camiseta',
    baseUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    defaultColors: ['white', 'black'],
  },
  hoodie: {
    name: 'Sudadera',
    baseUid: 'apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    defaultColors: ['white', 'black'],
  },
  mug: {
    name: 'Taza',
    baseUid: 'mug_product_gca_ceramic',
    fixedVariants: [{ size: '11oz', productUid: 'mug_product_gca_ceramic_gsi_11oz_gco_white_gpr_4-4' }],
  },
  poster: {
    name: 'Poster',
    baseUid: 'poster_product_gca_premium-matte',
    fixedVariants: [
      { size: '30x40cm', productUid: 'poster_product_gca_premium-matte_gsi_30x40_gpr_4-4' },
      { size: '50x70cm', productUid: 'poster_product_gca_premium-matte_gsi_50x70_gpr_4-4' },
    ],
  },
};

// Generar variantes basadas en tallas y colores seleccionados
function generateVariants(
  productType: string,
  sizes: string[],
  colors: string[],
  name: string,
  imageUrl: string
) {
  const template = PRODUCT_TEMPLATES[productType as keyof typeof PRODUCT_TEMPLATES];
  if (!template) return [];

  // Si tiene variantes fijas (tazas, posters), usar esas
  if ('fixedVariants' in template && template.fixedVariants) {
    return template.fixedVariants.map((v) => ({
      productUid: v.productUid,
      title: `${name} - ${v.size}`,
      files: [{ url: imageUrl, type: 'default' }],
    }));
  }

  // Generar variantes dinámicas para ropa
  const variants: any[] = [];
  const useSizes = sizes.length > 0 ? sizes : (template as any).defaultSizes;
  const useColors = colors.length > 0 ? colors : (template as any).defaultColors;

  for (const color of useColors) {
    for (const size of useSizes) {
      const sizeCode = SIZE_CODES[size] || size.toLowerCase();
      const colorCode = COLOR_CODES[color] || color;
      const productUid = `${template.baseUid}_gsi_${sizeCode}_gco_${colorCode}_gpr_4-4`;

      variants.push({
        productUid: productUid,
        title: `${name} - ${color.charAt(0).toUpperCase() + color.slice(1)} - ${size}`,
        files: [{ url: imageUrl, type: 'default' }],
      });
    }
  }

  return variants;
}


// Crear producto en Gelato
async function createGelatoProduct(
  name: string,
  description: string,
  imageUrl: string,
  productTypes: string[],
  sizes: string[] = [],
  colors: string[] = [],
  price?: number
): Promise<any[]> {
  const createdProducts: any[] = [];

  for (const type of productTypes) {
    const template = PRODUCT_TEMPLATES[type as keyof typeof PRODUCT_TEMPLATES];
    if (!template) continue;

    const variants = generateVariants(type, sizes, colors, name, imageUrl);

    if (variants.length === 0) {
      console.warn(`⚠️ No se generaron variantes para ${type}`);
      continue;
    }

    const productData: any = {
      title: `${name} - ${template.name}`,
      description: description,
      variants: variants,
      isAvailable: true,
      previewUrl: imageUrl,
    };

    // Añadir precio si se especifica
    if (price && price > 0) {
      productData.retailPrice = {
        amount: price,
        currency: 'EUR',
      };
    }

    try {
      console.log(`📦 Creando ${template.name} en Gelato con ${variants.length} variantes...`);
      const response = await gelatoApi.post(`/stores/${storeId}/products`, productData);
      createdProducts.push({
        type: type,
        name: template.name,
        variantCount: variants.length,
        product: response.data,
      });
      console.log(`✅ ${template.name} creada con ${variants.length} variantes`);
    } catch (error: any) {
      console.error(`❌ Error creando ${template.name}:`, error.response?.data || error.message);
      // Intentar sin precio si falla
      if (price && error.response?.status === 400) {
        try {
          delete productData.retailPrice;
          const response = await gelatoApi.post(`/stores/${storeId}/products`, productData);
          createdProducts.push({
            type: type,
            name: template.name,
            variantCount: variants.length,
            product: response.data,
          });
          console.log(`✅ ${template.name} creada (sin precio personalizado)`);
        } catch (retryError: any) {
          console.error(`❌ Reintento fallido:`, retryError.response?.data || retryError.message);
        }
      }
    }
  }

  return createdProducts;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const {
      prompt,
      name,
      description,
      productTypes = ['tshirt'],
      price,
      sizes = [],
      colors = []
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere un prompt' },
        { status: 400 }
      );
    }

    console.log('🚀 Iniciando pipeline automático...');
    console.log('📝 Prompt:', prompt);
    console.log('📦 Productos:', productTypes);
    console.log('💰 Precio:', price);
    console.log('📏 Tallas:', sizes);
    console.log('🎨 Colores:', colors);

    // Paso 1: Generar imagen con OpenRouter
    const generatedImageUrl = await generateImageWithOpenRouter(prompt);

    // Paso 2: Subir a hosting permanente
    console.log('📤 Subiendo a hosting permanente...');
    const permanentUrl = await uploadToImgur(generatedImageUrl);
    console.log('✅ URL permanente:', permanentUrl);

    // Paso 3: Crear productos en Gelato
    const productName = name || `Diseño IA - ${new Date().toLocaleDateString('es-ES')}`;
    const productDescription = description || `Diseño único generado con inteligencia artificial. Prompt: "${prompt}"`;

    const createdProducts = await createGelatoProduct(
      productName,
      productDescription,
      permanentUrl,
      productTypes,
      sizes,
      colors,
      price
    );

    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl,
      products: createdProducts,
      message: `Pipeline completado: ${createdProducts.length} productos creados`,
    });
  } catch (error: any) {
    console.error('❌ Error en pipeline:', error);

    return NextResponse.json(
      { error: error.message || 'Error en el pipeline automático' },
      { status: 500 }
    );
  }
}
