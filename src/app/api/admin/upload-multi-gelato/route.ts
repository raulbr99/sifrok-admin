import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { gelatoApi } from '@/lib/gelato';
import axios from 'axios';

const storeId = process.env.GELATO_STORE_ID || '';

async function uploadImageToImgur(dataUrl: string): Promise<string> {
  try {
    // Extraer el base64 de la data URL
    const base64Data = dataUrl.split(',')[1];

    // Subir a Imgur (gratis, sin auth para imágenes temporales)
    const response = await axios.post(
      'https://api.imgur.com/3/image',
      { image: base64Data },
      {
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7'}`, // Client ID público de ejemplo
        },
      }
    );

    return response.data.data.link;
  } catch (error) {
    console.error('Error subiendo a Imgur:', error);
    throw new Error('No se pudo subir la imagen');
  }
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

    const { designs, productType, name } = await req.json();

    if (!designs || designs.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren diseños' },
        { status: 400 }
      );
    }

    console.log('📦 Creando producto multi-diseño en Gelato:', { productType, name, designs: designs.length });

    // Subir imágenes a Imgur si son data URLs
    console.log('📤 Subiendo imágenes a hosting externo...');
    const uploadedUrls: Record<string, string> = {};

    for (const design of designs) {
      let imageUrl = design.imageUrl;

      // Si es una data URL (base64), subirla a Imgur
      if (imageUrl.startsWith('data:')) {
        console.log(`📤 Subiendo ${design.area} a Imgur...`);
        imageUrl = await uploadImageToImgur(imageUrl);
        console.log(`✅ ${design.area} subida:`, imageUrl);
      }

      uploadedUrls[design.area] = imageUrl;
    }

    // Gelato requiere crear variantes con sus archivos
    // Estructura basada en la documentación de Gelato E-commerce API
    const variants = [
      {
        productUid: productType === 'hoodie'
          ? 'apparel_product_gildan_18500_0_white_s'
          : 'apparel_product_gildan_5000_0_white_s',
        title: `${name || 'Diseño Multi-Área'} - White - S`,
        files: Object.entries(uploadedUrls).map(([area, url]) => ({
          url: url,
          type: area === 'front' ? 'default' : area,
        })),
      },
      {
        productUid: productType === 'hoodie'
          ? 'apparel_product_gildan_18500_0_white_m'
          : 'apparel_product_gildan_5000_0_white_m',
        title: `${name || 'Diseño Multi-Área'} - White - M`,
        files: Object.entries(uploadedUrls).map(([area, url]) => ({
          url: url,
          type: area === 'front' ? 'default' : area,
        })),
      },
      {
        productUid: productType === 'hoodie'
          ? 'apparel_product_gildan_18500_0_white_l'
          : 'apparel_product_gildan_5000_0_white_l',
        title: `${name || 'Diseño Multi-Área'} - White - L`,
        files: Object.entries(uploadedUrls).map(([area, url]) => ({
          url: url,
          type: area === 'front' ? 'default' : area,
        })),
      },
    ];

    // Crear producto en Gelato con variantes
    const productData = {
      title: name || 'Diseño Multi-Área',
      description: `Producto con ${designs.length} diseños personalizados generados con IA`,
      variants: variants,
      isAvailable: true,
    };

    console.log('📤 Enviando a Gelato:', JSON.stringify(productData, null, 2));

    // Usar la E-commerce API para crear productos en la tienda
    const response = await gelatoApi.post(`/stores/${storeId}/products`, productData);

    console.log('✅ Producto creado en Gelato:', response.data);

    return NextResponse.json({
      success: true,
      product: response.data,
      message: 'Producto creado exitosamente en Gelato',
    });
  } catch (error: any) {
    console.error('❌ Error creating multi-design product in Gelato:', error);

    if (error.response) {
      console.error('📄 Respuesta de error:', error.response.data);
      console.error('🔢 Status:', error.response.status);
    }

    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Error al crear producto en Gelato' },
      { status: 500 }
    );
  }
}
