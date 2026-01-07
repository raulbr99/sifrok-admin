// Configuración de modelos de Replicate disponibles

export const IMAGE_GENERATION_MODELS = {
  // Google Gemini - Rápido y económico
  'nano-banana-pro': {
    id: 'google/nano-banana-pro',
    name: 'Nano Banana Pro (Gemini)',
    description: 'Rápido, bueno con texto, 2K',
    speed: 'Muy rápido (2-5s)',
    quality: 'Alta',
    cost: 'Bajo',
    strengths: ['Texto preciso', 'Económico', 'Velocidad'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    maxResolution: '2K',
    supportsImageInput: false, // No soporta edición
  },

  // FLUX - Mejor calidad general
  'flux-dev': {
    id: 'black-forest-labs/flux-dev',
    name: 'FLUX.1 Dev',
    description: 'Mejor calidad, excelente con poses y manos',
    speed: 'Lento (40-60s)',
    quality: 'Excelente',
    cost: 'Alto',
    strengths: ['Calidad superior', 'Texto perfecto', 'Poses realistas', 'Manos correctas'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
    maxResolution: '1024px',
    supportsImageInput: true, // Soporta edición
  },

  'flux-schnell': {
    id: 'black-forest-labs/flux-schnell',
    name: 'FLUX.1 Schnell',
    description: 'FLUX rápido, buena calidad',
    speed: 'Rápido (5-10s)',
    quality: 'Muy buena',
    cost: 'Medio',
    strengths: ['Velocidad', 'Calidad FLUX', 'Texto bueno'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    maxResolution: '1024px',
    supportsImageInput: true, // Soporta edición
  },

  'flux-pro': {
    id: 'black-forest-labs/flux-pro',
    name: 'FLUX.1 Pro',
    description: 'Máxima calidad FLUX',
    speed: 'Muy lento (60-90s)',
    quality: 'Máxima',
    cost: 'Muy alto',
    strengths: ['Mejor calidad del mercado', 'Texto perfecto', 'Máximo detalle'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
    maxResolution: '1440px',
    supportsImageInput: true, // Soporta edición
  },

  // SDXL - Equilibrio precio/calidad
  'sdxl': {
    id: 'stability-ai/sdxl',
    name: 'Stable Diffusion XL',
    description: 'Versátil, ecosistema maduro',
    speed: 'Medio (10-15s)',
    quality: 'Buena',
    cost: 'Bajo',
    strengths: ['Económico', 'Versátil', 'Muchos estilos'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    maxResolution: '1024px',
    supportsImageInput: true, // Soporta edición
  },

  'sdxl-lightning': {
    id: 'bytedance/sdxl-lightning-4step',
    name: 'SDXL Lightning',
    description: 'SDXL ultra rápido',
    speed: 'Ultra rápido (1-3s)',
    quality: 'Buena',
    cost: 'Muy bajo',
    strengths: ['Velocidad extrema', 'Económico', 'Iteración rápida'],
    aspectRatios: ['1:1', '16:9', '9:16'],
    maxResolution: '1024px',
    supportsImageInput: false, // No soporta edición
  },

  // Modelos especializados ByteDance
  'seedream-4': {
    id: 'bytedance/seedream-4',
    name: 'SeeDream-4',
    description: 'Última versión, máxima calidad 2025',
    speed: 'Medio (20-30s)',
    quality: 'Máxima Plus',
    cost: 'Alto',
    strengths: ['Mejor calidad del mercado', 'Prompt following perfecto', 'Realismo extremo', 'Creatividad superior'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    maxResolution: '1024px',
    supportsImageInput: true, // Soporta edición
  },

  'seedream-3': {
    id: 'bytedance/seedream-3',
    name: 'SeeDream-3',
    description: 'Estado del arte, excelente calidad',
    speed: 'Medio (15-25s)',
    quality: 'Máxima',
    cost: 'Medio',
    strengths: ['Calidad superior', 'Prompt following', 'Diversidad visual', 'Detalles increíbles'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    maxResolution: '1024px',
    supportsImageInput: true, // Soporta edición
  },

  'ideogram-v2': {
    id: 'ideogram-ai/ideogram-v2',
    name: 'Ideogram v2',
    description: 'Especialista en texto legible',
    speed: 'Medio (15-20s)',
    quality: 'Muy buena',
    cost: 'Medio',
    strengths: ['Texto realista', 'Tipografías', 'Logos'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    maxResolution: '1024px',
    supportsImageInput: false, // No soporta edición
  },

  'recraft-v3': {
    id: 'recraft-ai/recraft-v3',
    name: 'Recraft V3',
    description: 'Genera SVG vectoriales',
    speed: 'Medio (15-20s)',
    quality: 'Muy buena',
    cost: 'Medio',
    strengths: ['SVG vectorial', 'Logos', 'Iconos', 'Ilustración'],
    aspectRatios: ['1:1', '16:9', '9:16'],
    maxResolution: 'Vector (SVG)',
    supportsImageInput: false, // No soporta edición
  },
} as const;

export const BACKGROUND_REMOVAL_MODELS = {
  'bria-rmbg-2': {
    id: 'bria/remove-background',
    name: 'BRIA RMBG 2.0',
    description: 'Mejor calidad, 256 niveles de transparencia',
    speed: 'Rápido (2-5s)',
    quality: 'Excelente',
    cost: 'Bajo',
    strengths: ['Transparencia suave', 'Bordes naturales', 'Comercial'],
  },

  'rembg': {
    id: 'cjwbw/rembg',
    name: 'Rembg',
    description: 'Rápido y gratuito',
    speed: 'Muy rápido (1-3s)',
    quality: 'Buena',
    cost: 'Muy bajo',
    strengths: ['Velocidad', 'Económico', 'Efectivo'],
  },

  'rembg-enhance': {
    id: 'smoretalk/rembg-enhance',
    name: 'Rembg Enhanced',
    description: 'Rembg mejorado con mejor matting',
    speed: 'Rápido (3-5s)',
    quality: 'Muy buena',
    cost: 'Bajo',
    strengths: ['Matting mejorado', 'Bordes suaves', 'Buen precio'],
  },
} as const;

export const TEXT_GENERATION_MODELS = {
  'gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Rápido y eficiente de Google - RECOMENDADO',
    speed: 'Muy rápido',
    quality: 'Excelente',
    cost: 'Bajo',
    strengths: ['Velocidad', 'Razonamiento avanzado', 'Económico'],
  },

  'claude-4.5-sonnet': {
    id: 'anthropic/claude-4.5-sonnet',
    name: 'Claude 4.5 Sonnet',
    description: 'Máxima calidad y creatividad',
    speed: 'Rápido',
    quality: 'Máxima',
    cost: 'Alto',
    strengths: ['Mejor calidad', 'Creatividad superior', 'Instrucciones complejas'],
  },

  'gpt-5': {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    description: 'Lo último de OpenAI',
    speed: 'Medio',
    quality: 'Máxima',
    cost: 'Muy alto',
    strengths: ['Razonamiento avanzado', 'Creatividad', 'Versatilidad'],
  },

  'mixtral-8x7b': {
    id: 'mistralai/mixtral-8x7b-instruct-v0.1',
    name: 'Mixtral 8x7B',
    description: 'Especialista en tareas creativas',
    speed: 'Rápido',
    quality: 'Muy buena',
    cost: 'Bajo',
    strengths: ['Creatividad', 'Seguimiento de instrucciones', 'Económico'],
  },

  'llama-3-70b': {
    id: 'meta/meta-llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Estable y confiable',
    speed: 'Rápido',
    quality: 'Muy buena',
    cost: 'Muy bajo',
    strengths: ['Velocidad', 'Económico', 'Estable'],
  },

  'llama-3-8b': {
    id: 'meta/meta-llama-3-8b-instruct',
    name: 'Llama 3 8B',
    description: 'Ultra rápido y económico',
    speed: 'Ultra rápido',
    quality: 'Buena',
    cost: 'Muy bajo',
    strengths: ['Velocidad extrema', 'Muy económico', 'Eficiente'],
  },
} as const;

export type ImageGenModel = keyof typeof IMAGE_GENERATION_MODELS;
export type BgRemovalModel = keyof typeof BACKGROUND_REMOVAL_MODELS;
export type TextGenModel = keyof typeof TEXT_GENERATION_MODELS;

// Helper para obtener el modelo por ID
export function getImageGenModel(id: ImageGenModel) {
  return IMAGE_GENERATION_MODELS[id];
}

export function getBgRemovalModel(id: BgRemovalModel) {
  return BACKGROUND_REMOVAL_MODELS[id];
}

export function getTextGenModel(id: TextGenModel) {
  return TEXT_GENERATION_MODELS[id];
}

// Modelos recomendados según el caso de uso
export const RECOMMENDED_MODELS = {
  image: {
    fastest: 'sdxl-lightning',
    bestQuality: 'seedream-4',
    bestValue: 'nano-banana-pro',
    bestText: 'ideogram-v2',
    bestForPrint: 'seedream-4',
    vector: 'recraft-v3',
  },
  text: {
    fastest: 'gemini-2.5-flash',
    bestQuality: 'claude-4.5-sonnet',
    bestValue: 'gemini-2.5-flash',
    creative: 'claude-4.5-sonnet',
  },
} as const;
