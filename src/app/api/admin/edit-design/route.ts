import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Replicate from 'replicate';
import { getImageGenModel } from '@/lib/replicate-models';

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
      // No es texto
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

    const {
      area,
      imageUrl,
      instructions,
      model = 'nano-banana-pro'
    } = await req.json();

    if (!imageUrl || !instructions) {
      return NextResponse.json(
        { error: 'Se requiere imagen e instrucciones' },
        { status: 400 }
      );
    }

    const selectedModel = getImageGenModel(model as any);
    console.log('✏️ Editando diseño:', { area, instructions, model: selectedModel.name });

    // Preparar input según el modelo
    const input: any = {
      prompt: instructions,
      image: imageUrl,
    };

    // Configuración específica por modelo
    if (selectedModel.id.includes('nano-banana')) {
      input.aspect_ratio = '1:1';
      input.output_format = 'png';
    } else if (selectedModel.id.includes('flux')) {
      input.aspect_ratio = '1:1';
      input.num_inference_steps = selectedModel.id.includes('schnell') ? 4 : 50;
    } else if (selectedModel.id.includes('sdxl')) {
      input.width = 1024;
      input.height = 1024;
      input.num_inference_steps = selectedModel.id.includes('lightning') ? 4 : 30;
    } else if (selectedModel.id.includes('seedream')) {
      input.aspect_ratio = '1:1';
      input.num_inference_steps = 30;
    } else {
      input.width = 1024;
      input.height = 1024;
    }

    const output = await replicate.run(
      selectedModel.id as any,
      { input }
    );

    console.log('🔍 Output recibido:', typeof output, Array.isArray(output));

    let newImageUrl: string;

    if (typeof output === 'string') {
      newImageUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      if (typeof firstItem === 'string') {
        newImageUrl = firstItem;
      } else {
        newImageUrl = await readStreamToDataUrl(firstItem);
      }
    } else {
      newImageUrl = await readStreamToDataUrl(output);
    }

    console.log('✅ Diseño editado exitosamente');

    return NextResponse.json({
      success: true,
      imageUrl: newImageUrl,
    });
  } catch (error: any) {
    console.error('❌ Error editing design:', error);

    return NextResponse.json(
      { error: error.message || 'Error al editar diseño' },
      { status: 500 }
    );
  }
}
