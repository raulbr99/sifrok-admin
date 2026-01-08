import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

async function readStreamToDataUrl(stream: any): Promise<string> {
  if (typeof stream === 'string' && stream.startsWith('http')) {
    return stream;
  }

  if (stream && typeof stream === 'object' && 'getReader' in stream) {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    try {
      const decoded = new TextDecoder().decode(combined);
      if (decoded.startsWith('http')) {
        return decoded;
      }
    } catch (e) {
      // Not valid text, proceed with binary image
    }

    const base64 = Buffer.from(combined).toString('base64');
    return `data:image/png;base64,${base64}`;
  }

  return String(stream);
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

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere una imagen' },
        { status: 400 }
      );
    }

    console.log('🎨 Removiendo fondo de imagen...');

    // Use BRIA RMBG 2.0 for background removal
    const output = await replicate.run(
      'bria-ai/remove-background:a029b78cf59c372e6104c9f32c3f24ef95da30e089e11910ff253cd74907f65f' as any,
      {
        input: {
          image: imageUrl,
        }
      }
    );

    let resultUrl: string;

    if (typeof output === 'string') {
      resultUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      if (typeof firstItem === 'string') {
        resultUrl = firstItem;
      } else {
        resultUrl = await readStreamToDataUrl(firstItem);
      }
    } else {
      resultUrl = await readStreamToDataUrl(output);
    }

    console.log('✅ Fondo removido exitosamente');

    return NextResponse.json({
      success: true,
      imageUrl: resultUrl,
    });
  } catch (error: any) {
    console.error('❌ Error removing background:', error);

    return NextResponse.json(
      { error: error.message || 'Error al remover el fondo' },
      { status: 500 }
    );
  }
}
