import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { printfulApi } from '@/lib/printful';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // TODO: Verificar que el usuario sea admin
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 403 }
    //   );
    // }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Convertir el archivo a base64 para enviarlo a Printful
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Subir archivo a Printful File Library
    const printfulResponse = await printfulApi.post('/files', {
      type: 'default',
      filename: file.name,
      url: `data:${file.type};base64,${base64}`,
    });

    console.log('✅ Archivo subido a Printful:', printfulResponse.data.result);

    return NextResponse.json({
      success: true,
      file: printfulResponse.data.result,
    });
  } catch (error: any) {
    console.error('❌ Error uploading file to Printful:', error);

    if (error.response) {
      console.error('Printful API error:', error.response.data);
      return NextResponse.json(
        { error: error.response.data.error?.message || 'Error al subir a Printful' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error al procesar el archivo' },
      { status: 500 }
    );
  }
}
