import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterImageResponse {
  imageUrl: string;
  isBase64: boolean;
}

/**
 * Generate an image using OpenRouter's image generation models
 * Based on the pattern from openrouter-multimodal project
 */
export async function generateImageWithOpenRouter(
  prompt: string,
  model: string = 'google/gemini-2.0-flash-exp:free'
): Promise<string> {
  console.log('🎨 Generando imagen con OpenRouter...');
  console.log('📝 Prompt:', prompt);
  console.log('🤖 Modelo:', model);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'Sifrok - AI Design Generator',
    },
    body: JSON.stringify({
      model,
      modalities: ['text', 'image'],
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ OpenRouter error:', error);
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  // Parse the image URL from the response
  const imageUrl = extractImageUrl(message);

  if (!imageUrl) {
    console.error('❌ No image in response:', JSON.stringify(message, null, 2));
    throw new Error('No se generó imagen en la respuesta');
  }

  console.log('✅ Imagen generada correctamente');
  return imageUrl;
}

/**
 * Extract image URL from OpenRouter response
 */
function extractImageUrl(message: any): string | null {
  // Format 1: message.images[].image_url.url
  if (message?.images && message.images.length > 0) {
    const imageUrl = message.images[0]?.image_url?.url;
    if (imageUrl) {
      return imageUrl;
    }
  }

  // Format 2: Array content with image_url parts
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return part.image_url.url;
      }
      // Format 3: inline_data (base64)
      if (part.inline_data?.data) {
        const mimeType = part.inline_data.mime_type || 'image/png';
        return `data:${mimeType};base64,${part.inline_data.data}`;
      }
    }
  }

  // Format 4: Base64 data URL embedded in text content
  const content = typeof message?.content === 'string' ? message.content : '';
  const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
  if (base64Match) {
    return base64Match[0];
  }

  return null;
}

/**
 * Upload image to Imgur for permanent hosting
 * Handles both URLs and base64 data
 */
export async function uploadToImgur(imageSource: string): Promise<string> {
  try {
    // If it's already a permanent URL (not base64 and not temporary), return as is
    if (
      imageSource.startsWith('http') &&
      !imageSource.includes('replicate.delivery') &&
      !imageSource.startsWith('data:')
    ) {
      return imageSource;
    }

    let base64Data: string;

    if (imageSource.startsWith('data:image')) {
      // Extract base64 from data URL
      const base64Part = imageSource.split(',')[1];
      if (!base64Part) {
        throw new Error('Invalid base64 data URL');
      }
      base64Data = base64Part;
    } else {
      // Download image from URL and convert to base64
      const response = await axios.get(imageSource, { responseType: 'arraybuffer' });
      base64Data = Buffer.from(response.data).toString('base64');
    }

    // Upload to Imgur
    const imgurResponse = await axios.post(
      'https://api.imgur.com/3/image',
      { image: base64Data },
      {
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7'}`,
        },
      }
    );

    const permanentUrl = imgurResponse.data.data.link;
    console.log('📤 Imagen subida a Imgur:', permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error('❌ Error subiendo a Imgur:', error);
    // Return original if upload fails
    return imageSource;
  }
}

/**
 * Full pipeline: generate image with AI and upload to permanent hosting
 */
export async function generateAndUploadImage(
  prompt: string,
  model?: string
): Promise<string> {
  // Generate the image
  const generatedUrl = await generateImageWithOpenRouter(prompt, model);

  // Upload to permanent hosting
  const permanentUrl = await uploadToImgur(generatedUrl);

  return permanentUrl;
}
