import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

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

    const { prompt, image } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere un prompt' },
        { status: 400 }
      );
    }

    console.log('🍌 Generando imagen con Nano Banana Pro:', prompt);
    if (image) {
      console.log('🖼️ Editando imagen existente:', image);
    }

    // Usar Nano Banana Pro (Google Gemini)
    const input: any = {
      prompt: prompt,
      aspect_ratio: "1:1",
      output_format: "png",
      resolution: "2K",
    };

    // Si hay una imagen para editar, agregarla al input
    if (image) {
      input.image = image;
    }

    const output = await replicate.run(
      "google/nano-banana",
      {
        input
      }
    );

    console.log('🔍 Tipo de output:', typeof output);
    console.log('🔍 Es array?:', Array.isArray(output));

    // El output es un array con un ReadableStream, necesitamos leerlo
    let imageUrl: string;

    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];

      // Si es un ReadableStream, convertirlo a string/URL
      if (firstItem && typeof firstItem === 'object' && 'getReader' in firstItem) {
        console.log('⚠️ Es un ReadableStream, leyendo chunks...');

        const reader = firstItem.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Concatenar todos los chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        // Convertir a string (debería ser una URL)
        imageUrl = new TextDecoder().decode(combined);
        console.log('✅ URL extraída del stream:', imageUrl);
      } else {
        imageUrl = String(firstItem);
      }
    } else {
      imageUrl = String(output);
    }

    console.log('✅ URL de imagen final:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
    });
  } catch (error: any) {
    console.error('❌ Error generating image with AI:', error);

    return NextResponse.json(
      { error: error.message || 'Error al generar imagen con IA' },
      { status: 500 }
    );
  }
}
