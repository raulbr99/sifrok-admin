import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

interface ProcessedModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
    image?: number;
  };
  isFree: boolean;
  canGenerateImages: boolean;
  canGenerateText: boolean;
  modality: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('📡 Fetching models from OpenRouter...');

    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data || [];

    console.log(`📦 Received ${models.length} models from OpenRouter`);

    // Process and categorize models
    const processedModels: ProcessedModel[] = models.map((model) => {
      const [provider, ...nameParts] = model.name.split(':');
      const displayName = nameParts.join(':').trim() || model.name;

      const promptPrice = parseFloat(model.pricing?.prompt || '0');
      const completionPrice = parseFloat(model.pricing?.completion || '0');
      const imagePrice = model.pricing?.image ? parseFloat(model.pricing.image) : undefined;

      const isFree = promptPrice === 0 && completionPrice === 0;

      const outputModalities = model.architecture?.output_modalities || [];
      const canGenerateImages = outputModalities.includes('image');
      const canGenerateText = outputModalities.includes('text');

      return {
        id: model.id,
        name: displayName || model.id,
        provider: provider?.trim() || 'Unknown',
        description: model.description || '',
        contextLength: model.context_length || 0,
        pricing: {
          prompt: promptPrice,
          completion: completionPrice,
          image: imagePrice,
        },
        isFree,
        canGenerateImages,
        canGenerateText,
        modality: model.architecture?.modality || 'text->text',
      };
    });

    // Filter and sort models for text generation
    const textModels = processedModels
      .filter((m) => m.canGenerateText)
      .sort((a, b) => {
        // Free models first, then by provider name
        if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
        return a.provider.localeCompare(b.provider);
      });

    // Filter and sort models for image generation
    const imageModels = processedModels
      .filter((m) => m.canGenerateImages)
      .sort((a, b) => {
        // Free models first, then by provider name
        if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
        return a.provider.localeCompare(b.provider);
      });

    console.log(`✅ Text models: ${textModels.length}, Image models: ${imageModels.length}`);

    return NextResponse.json({
      success: true,
      textModels,
      imageModels,
      totalModels: models.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error fetching models:', error);

    return NextResponse.json(
      { error: error.message || 'Error al obtener modelos' },
      { status: 500 }
    );
  }
}
