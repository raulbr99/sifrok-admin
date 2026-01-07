import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { printfulApi } from '@/lib/printful';

export async function GET() {
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

    // Obtener archivos de Printful File Library
    const response = await printfulApi.get('/files');

    console.log('📁 Archivos de Printful:', response.data.result);

    return NextResponse.json({
      files: response.data.result || [],
    });
  } catch (error: any) {
    console.error('❌ Error fetching files from Printful:', error);

    if (error.response) {
      console.error('Printful API error:', error.response.data);
      return NextResponse.json(
        { error: error.response.data.error?.message || 'Error al obtener archivos' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Error al obtener archivos' },
      { status: 500 }
    );
  }
}
