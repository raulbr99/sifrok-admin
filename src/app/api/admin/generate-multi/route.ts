import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Replicate from 'replicate';
import { getImageGenModel, getBgRemovalModel } from '@/lib/replicate-models';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Tipos de áreas donde se pueden colocar diseños
export const DESIGN_AREAS = {
  front: {
    label: 'Frente',
    prompt: 'main design, bold and eye-catching, isolated on transparent or white background, high quality vector style, no mockup, no clothing'
  },
  back: {
    label: 'Espalda',
    prompt: 'complementary design variation, cohesive style, isolated on transparent or white background, no mockup, no clothing'
  },
  sleeve_left: {
    label: 'Manga Izquierda',
    prompt: 'small accent design, simple icon or minimal pattern, isolated on transparent or white background, no mockup, no clothing'
  },
  sleeve_right: {
    label: 'Manga Derecha',
    prompt: 'small accent design, simple icon or minimal pattern, isolated on transparent or white background, no mockup, no clothing'
  },
} as const;

async function readStreamToDataUrl(stream: any): Promise<string> {
  // Si ya es una URL string, devolverla directamente
  if (typeof stream === 'string' && stream.startsWith('http')) {
    return stream;
  }

  // Si es un ReadableStream, leerlo
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

    // Intentar decodificar como texto primero (puede ser una URL)
    try {
      const decoded = new TextDecoder().decode(combined);
      if (decoded.startsWith('http')) {
        return decoded;
      }
    } catch (e) {
      // No es texto válido, proceder con imagen binaria
    }

    // Es una imagen binaria, convertir a data URL
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
      prompt,
      productType = 'apparel',
      areas = ['front', 'back'],
      model = 'nano-banana-pro',
      removeBackground = false
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere un prompt' },
        { status: 400 }
      );
    }

    const selectedModel = getImageGenModel(model as any);
    console.log('🎨 Generando diseños multi-área:', {
      prompt,
      productType,
      areas,
      model: selectedModel.name,
      removeBackground
    });

    // Generar prompts específicos para cada área
    const designs: Record<string, string> = {};

    for (const area of areas) {
      const areaConfig = DESIGN_AREAS[area as keyof typeof DESIGN_AREAS];
      if (!areaConfig) continue;

      const specificPrompt = `${prompt}, ${areaConfig.prompt}`;

      console.log(`🍌 Generando ${areaConfig.label} con prompt:`, specificPrompt);

      try {
        // Preparar input según el modelo
        const input: any = {
          prompt: specificPrompt,
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

        console.log(`🔍 Output para ${areaConfig.label}:`, typeof output, Array.isArray(output));

        let imageUrl: string;

        // Nano-banana puede devolver:
        // 1. URL string directa
        // 2. Array con URL
        // 3. ReadableStream con imagen binaria
        if (typeof output === 'string') {
          imageUrl = output;
        } else if (Array.isArray(output) && output.length > 0) {
          const firstItem = output[0];
          if (typeof firstItem === 'string') {
            imageUrl = firstItem;
          } else {
            imageUrl = await readStreamToDataUrl(firstItem);
          }
        } else {
          imageUrl = await readStreamToDataUrl(output);
        }

        // Si se requiere remover el fondo
        if (removeBackground && imageUrl) {
          console.log(`🎨 Removiendo fondo de ${areaConfig.label}...`);

          try {
            const bgRemovalModel = getBgRemovalModel('bria-rmbg-2');
            const bgOutput = await replicate.run(
              bgRemovalModel.id as any,
              {
                input: {
                  image: imageUrl,
                }
              }
            );

            // Procesar output de remoción de fondo
            if (typeof bgOutput === 'string') {
              imageUrl = bgOutput;
            } else if (Array.isArray(bgOutput) && bgOutput.length > 0) {
              const firstItem = bgOutput[0];
              if (typeof firstItem === 'string') {
                imageUrl = firstItem;
              } else {
                imageUrl = await readStreamToDataUrl(firstItem);
              }
            }

            console.log(`✅ Fondo removido de ${areaConfig.label}`);
          } catch (bgError: any) {
            console.error(`⚠️ Error removiendo fondo de ${areaConfig.label}:`, bgError.message);
            // Continuar con la imagen original si falla
          }
        }

        designs[area] = imageUrl;
        console.log(`✅ ${areaConfig.label} generado, longitud:`, imageUrl.substring(0, 50));
      } catch (error: any) {
        console.error(`❌ Error generando ${areaConfig.label}:`, error.message);
        // Continuar con las demás áreas aunque una falle
      }
    }

    if (Object.keys(designs).length === 0) {
      return NextResponse.json(
        { error: 'No se pudo generar ningún diseño' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      designs,
      areas: Object.keys(designs).map(area => ({
        area,
        label: DESIGN_AREAS[area as keyof typeof DESIGN_AREAS].label,
        imageUrl: designs[area],
      })),
    });
  } catch (error: any) {
    console.error('❌ Error generating multi-area designs:', error);

    return NextResponse.json(
      { error: error.message || 'Error al generar diseños multi-área' },
      { status: 500 }
    );
  }
}
