import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { gelatoApi } from '@/lib/gelato';
import { generateImageWithOpenRouter, uploadToImgur } from '@/lib/openrouter';

const storeId = process.env.GELATO_STORE_ID || '';

// Plantillas de prompts por temática
const THEME_TEMPLATES: Record<string, string[]> = {
  marvel: [
    'minimalist Spider-Man logo design, red and blue, comic style, for t-shirt print, transparent background',
    'Iron Man arc reactor glowing design, futuristic, metallic, for merchandise',
    'Captain America shield iconic design, patriotic colors, vintage style',
    'Hulk fist smashing through, green rage, comic book style',
    'Thor hammer Mjolnir with lightning, epic Norse mythology style',
    'Black Panther mask silhouette, Wakanda forever, tribal patterns',
    'Avengers A logo, assembled heroes, epic composition',
    'Deadpool chibi character, funny pose, breaking fourth wall',
  ],
  anime: [
    'anime style dragon ball energy blast, powerful aura, vibrant colors',
    'naruto inspired ninja silhouette, hidden leaf village symbol',
    'one piece jolly roger skull design, pirate style',
    'attack on titan survey corps wings of freedom emblem',
    'demon slayer katana with flame effects, japanese style',
    'my hero academia plus ultra text design, heroic style',
    'studio ghibli inspired forest spirit, magical nature',
    'jujutsu kaisen cursed energy effects, dark aesthetic',
  ],
  gaming: [
    'retro pixel art game controller, 8-bit style, nostalgic',
    'epic sword and shield design, fantasy RPG style',
    'futuristic cyberpunk helmet, neon lights, sci-fi',
    'classic arcade machine design, vintage gaming',
    'battle royale victory crown, winner aesthetic',
    'steampunk gaming gear, mechanical gears, brass',
    'esports team logo style, competitive gaming',
    'dungeon master dice set, D20, fantasy tabletop',
  ],
  streetwear: [
    'urban graffiti art style text, street culture',
    'japanese kanji with cherry blossoms, aesthetic',
    'skull with roses, dark romantic style',
    'abstract geometric patterns, modern art',
    'vintage car illustration, retro vibes',
    'neon sign style design, city lights',
    'hip hop culture inspired design, old school',
    'skateboard culture graphics, extreme sports',
  ],
  nature: [
    'majestic mountain landscape silhouette, adventure',
    'ocean wave great wave style, japanese art',
    'forest trees minimalist design, nature lover',
    'wild wolf howling at moon, wilderness',
    'tropical palm trees sunset, beach vibes',
    'constellation star map design, astronomy',
    'botanical flower illustration, elegant',
    'wildlife bear in forest, outdoor adventure',
  ],
  humor: [
    'funny cat with sunglasses, cool attitude',
    'pizza slice with superhero cape, food humor',
    'coffee cup with tired face, monday mood',
    'sloth hanging lazy, procrastination king',
    'taco tuesday celebration, food lover',
    'introvert battery low design, relatable',
    'dog in space suit, absurd humor',
    'avocado doing yoga, healthy lifestyle joke',
  ],
};

// Templates de productos
const PRODUCT_TEMPLATES = {
  tshirt: {
    name: 'Camiseta',
    variants: [
      { size: 'S', productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_s_gco_white_gpr_4-4' },
      { size: 'M', productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_m_gco_white_gpr_4-4' },
      { size: 'L', productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_l_gco_white_gpr_4-4' },
      { size: 'XL', productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_xl_gco_white_gpr_4-4' },
    ],
  },
  hoodie: {
    name: 'Sudadera',
    variants: [
      { size: 'S', productUid: 'apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_s_gco_white_gpr_4-4' },
      { size: 'M', productUid: 'apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_m_gco_white_gpr_4-4' },
      { size: 'L', productUid: 'apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_l_gco_white_gpr_4-4' },
      { size: 'XL', productUid: 'apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_xl_gco_white_gpr_4-4' },
    ],
  },
};


async function createGelatoProduct(
  name: string,
  description: string,
  imageUrl: string,
  productType: string
): Promise<any> {
  const template = PRODUCT_TEMPLATES[productType as keyof typeof PRODUCT_TEMPLATES];
  if (!template) return null;

  const variants = template.variants.map((v) => ({
    productUid: v.productUid,
    title: `${name} - ${v.size}`,
    files: [{ url: imageUrl, type: 'default' }],
  }));

  const productData = {
    title: name,
    description: description,
    variants: variants,
    isAvailable: true,
    previewUrl: imageUrl,
  };

  try {
    const response = await gelatoApi.post(`/stores/${storeId}/products`, productData);
    return response.data;
  } catch (error: any) {
    console.error(`Error creando producto:`, error.response?.data || error.message);
    return null;
  }
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
      theme,
      customPrompts,
      count = 4,
      productType = 'tshirt',
      collectionName
    } = await req.json();

    // Obtener prompts a usar
    let prompts: string[] = [];

    if (customPrompts && customPrompts.length > 0) {
      prompts = customPrompts.slice(0, count);
    } else if (theme && THEME_TEMPLATES[theme]) {
      prompts = THEME_TEMPLATES[theme].slice(0, count);
    } else {
      return NextResponse.json(
        { error: 'Se requiere un tema válido o prompts personalizados' },
        { status: 400 }
      );
    }

    console.log(`🚀 Iniciando generación batch de ${prompts.length} diseños...`);
    console.log(`📦 Tipo de producto: ${productType}`);
    console.log(`🎨 Tema: ${theme || 'personalizado'}`);

    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`\n--- Diseño ${i + 1}/${prompts.length} ---`);
      console.log(`📝 Prompt: ${prompt}`);

      try {
        // Generar imagen con OpenRouter
        console.log('🎨 Generando imagen con OpenRouter...');
        const imageUrl = await generateImageWithOpenRouter(`${prompt}, high quality, detailed, professional design for merchandise`);

        // Subir a hosting permanente
        console.log('📤 Subiendo a hosting...');
        const permanentUrl = await uploadToImgur(imageUrl);

        // Crear nombre único
        const designNumber = i + 1;
        const baseName = collectionName || (theme ? `Colección ${theme.charAt(0).toUpperCase() + theme.slice(1)}` : 'Diseño IA');
        const productName = `${baseName} #${designNumber}`;

        // Crear producto en Gelato
        console.log('📦 Creando producto en Gelato...');
        const product = await createGelatoProduct(
          productName,
          `Diseño único generado con IA. Parte de la colección "${baseName}".`,
          permanentUrl,
          productType
        );

        if (product) {
          results.push({
            index: i + 1,
            prompt: prompt,
            imageUrl: permanentUrl,
            product: product,
            success: true,
          });
          console.log(`✅ Diseño ${i + 1} completado`);
        } else {
          errors.push(`Diseño ${i + 1}: Error creando producto`);
        }

        // Pequeña pausa entre generaciones para evitar rate limits
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`❌ Error en diseño ${i + 1}:`, error.message);
        errors.push(`Diseño ${i + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRequested: prompts.length,
      totalCreated: results.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generación batch completada: ${results.length}/${prompts.length} productos creados`,
    });
  } catch (error: any) {
    console.error('❌ Error en generación batch:', error);

    return NextResponse.json(
      { error: error.message || 'Error en la generación batch' },
      { status: 500 }
    );
  }
}

// GET para obtener las temáticas disponibles
export async function GET() {
  return NextResponse.json({
    themes: Object.keys(THEME_TEMPLATES).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      designCount: THEME_TEMPLATES[key].length,
      previews: THEME_TEMPLATES[key].slice(0, 3),
    })),
    productTypes: Object.keys(PRODUCT_TEMPLATES).map(key => ({
      id: key,
      name: PRODUCT_TEMPLATES[key as keyof typeof PRODUCT_TEMPLATES].name,
    })),
  });
}
