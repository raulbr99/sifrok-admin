import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Replicate from 'replicate';
import { getTextGenModel } from '@/lib/replicate-models';

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

    const { prompt, instructions, model = 'gemini-2.5-flash' } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere un prompt' },
        { status: 400 }
      );
    }

    const selectedModel = getTextGenModel(model as any);
    console.log('✨ Mejorando prompt con:', selectedModel.name);
    console.log('📝 Prompt original:', prompt);
    if (instructions) {
      console.log('📝 Instrucciones adicionales:', instructions);
    }

    // Construir el mensaje
    const userMessage = `Transform this simple prompt into a detailed, high-quality prompt for creating print designs for merchandise. Make it specific, detailed, and artistic.

IMPORTANT: The design should be isolated, not shown on clothing. Focus on the design itself.

User prompt: ${prompt}${instructions ? `\n\nAdditional instructions: ${instructions}` : ''}

Return only the enhanced prompt, nothing else. Make it concise but detailed (2-3 sentences max).`;

    // Configurar input según el modelo
    const input: any = {
      prompt: userMessage,
    };

    // Parámetros específicos por modelo
    if (selectedModel.id.includes('gemini')) {
      // Google Gemini
      input.max_tokens = 250;
      input.temperature = 0.7;
    } else if (selectedModel.id.includes('claude')) {
      // Anthropic Claude
      input.max_tokens = 250;
      input.temperature = 0.7;
    } else if (selectedModel.id.includes('gpt')) {
      // OpenAI GPT
      input.max_tokens = 250;
      input.temperature = 0.7;
    } else if (selectedModel.id.includes('llama')) {
      // Meta Llama
      input.max_new_tokens = 250;
      input.temperature = 0.7;
      input.top_p = 0.9;
    } else if (selectedModel.id.includes('mixtral')) {
      // Mixtral
      input.max_new_tokens = 250;
      input.temperature = 0.7;
      input.top_p = 0.9;
    } else {
      // Fallback
      input.max_tokens = 250;
      input.temperature = 0.7;
    }

    console.log('🔧 Input configurado:', {
      model: selectedModel.id,
      promptLength: userMessage.length,
      params: Object.keys(input)
    });

    const output = await replicate.run(
      selectedModel.id as any,
      { input }
    );

    // Replicate devuelve un array de strings para modelos de texto
    const enhancedPrompt = Array.isArray(output) ? output.join('') : String(output);

    console.log('✅ Prompt mejorado:', enhancedPrompt);

    return NextResponse.json({
      success: true,
      enhancedPrompt: enhancedPrompt.trim(),
    });
  } catch (error: any) {
    console.error('❌ Error enhancing prompt:', error);

    return NextResponse.json(
      { error: error.message || 'Error al mejorar el prompt' },
      { status: 500 }
    );
  }
}
