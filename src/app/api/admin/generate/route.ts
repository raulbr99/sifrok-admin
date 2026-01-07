import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateAndUploadImage } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { prompt, image, model = 'google/gemini-2.0-flash-exp:free' } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere un prompt' },
        { status: 400 }
      );
    }

    console.log('🎨 Generando imagen con OpenRouter');
    console.log('📝 Prompt:', prompt);
    console.log('🤖 Modelo:', model);

    // Build the full prompt for image generation
    let fullPrompt = prompt;

    // If editing an existing image, include reference
    if (image) {
      console.log('🖼️ Editando imagen existente');
      fullPrompt = `Edit this image: ${image}\n\nChanges requested: ${prompt}`;
    } else {
      // Add design-specific instructions for new images
      fullPrompt = `Create a high-quality design for merchandise (t-shirt, hoodie, poster).
The design should be:
- Clean and professional
- Suitable for print
- High contrast
- Without background or on transparent/simple background

Design description: ${prompt}

Generate a single, isolated design image.`;
    }

    // Generate image using OpenRouter
    const imageUrl = await generateAndUploadImage(fullPrompt, model);

    console.log('✅ Imagen generada:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
    });
  } catch (error: any) {
    console.error('❌ Error generating image:', error);

    return NextResponse.json(
      { error: error.message || 'Error al generar imagen con IA' },
      { status: 500 }
    );
  }
}
