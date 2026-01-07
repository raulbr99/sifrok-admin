import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { theme, style, count = 5, model = 'google/gemini-2.0-flash-exp:free' } = await req.json();

    if (!theme) {
      return NextResponse.json(
        { error: 'Se requiere un tema' },
        { status: 400 }
      );
    }

    console.log('💡 Generando ideas con OpenRouter...');
    console.log('🎯 Tema:', theme);
    console.log('🎨 Estilo:', style || 'general');
    console.log('🤖 Modelo:', model);

    const systemPrompt = `You are a creative designer specialized in generating unique and trendy design ideas for merchandise (t-shirts, hoodies, posters, mugs).
Your ideas should be:
- Original and unique
- Suitable for print-on-demand products
- Trendy and appealing to modern audiences
- Described in detail for AI image generation

Always respond in JSON format with an array of ideas. Each idea should have:
- "title": Short catchy name (2-4 words)
- "prompt": Detailed prompt for image generation (in English, optimized for AI)
- "tags": Array of 3-5 relevant tags`;

    const userPrompt = `Generate ${count} unique design ideas for the theme: "${theme}"${style ? ` in ${style} style` : ''}.

Make each idea distinct and creative. The prompts should be detailed enough for AI image generation, focusing on visual elements, colors, composition, and style.

Return ONLY valid JSON in this format:
{
  "ideas": [
    {
      "title": "Design Name",
      "prompt": "Detailed prompt for AI image generation...",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Sifrok - AI Design Ideas',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenRouter error:', error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No se generaron ideas');
    }

    // Parse the JSON response
    let ideas;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        ideas = parsed.ideas || parsed;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Error parsing response:', content);
      throw new Error('Error al parsear las ideas generadas');
    }

    console.log(`✅ ${ideas.length} ideas generadas`);

    return NextResponse.json({
      success: true,
      ideas,
      model,
    });
  } catch (error: any) {
    console.error('❌ Error generating ideas:', error);

    return NextResponse.json(
      { error: error.message || 'Error al generar ideas' },
      { status: 500 }
    );
  }
}
