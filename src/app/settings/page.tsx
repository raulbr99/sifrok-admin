'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  Sparkles,
  Check,
  Zap,
  DollarSign,
  Brain,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

// OpenRouter models for text generation (ideas, prompt enhancement)
const TEXT_MODELS = [
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Rápido y gratuito',
    speed: 'Muy rápido',
    cost: 'Gratis',
    recommended: true,
  },
  {
    id: 'google/gemini-exp-1206:free',
    name: 'Gemini Experimental',
    provider: 'Google',
    description: 'Experimental, alta calidad',
    speed: 'Rápido',
    cost: 'Gratis',
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    provider: 'Meta',
    description: 'Ligero y eficiente',
    speed: 'Ultra rápido',
    cost: 'Gratis',
  },
  {
    id: 'qwen/qwen-2-7b-instruct:free',
    name: 'Qwen 2 7B',
    provider: 'Alibaba',
    description: 'Buen equilibrio calidad/velocidad',
    speed: 'Rápido',
    cost: 'Gratis',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Máxima calidad y creatividad',
    speed: 'Medio',
    cost: 'Pago',
    premium: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Muy versátil y creativo',
    speed: 'Medio',
    cost: 'Pago',
    premium: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Rápido y económico',
    speed: 'Rápido',
    cost: 'Bajo',
  },
];

// OpenRouter models for image generation
const IMAGE_MODELS = [
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Genera imágenes gratis',
    speed: 'Rápido',
    cost: 'Gratis',
    recommended: true,
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'Black Forest Labs',
    description: 'Máxima calidad',
    speed: 'Lento',
    cost: 'Pago',
    premium: true,
  },
  {
    id: 'black-forest-labs/flux-schnell',
    name: 'FLUX Schnell',
    provider: 'Black Forest Labs',
    description: 'Rápido con buena calidad',
    speed: 'Rápido',
    cost: 'Medio',
  },
];

export default function SettingsPage() {
  const [textModel, setTextModel] = useState('google/gemini-2.0-flash-exp:free');
  const [imageModel, setImageModel] = useState('google/gemini-2.0-flash-exp:free');
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedTextModel = localStorage.getItem('openrouter-text-model');
    const savedImageModel = localStorage.getItem('openrouter-image-model');
    if (savedTextModel) setTextModel(savedTextModel);
    if (savedImageModel) setImageModel(savedImageModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem('openrouter-text-model', textModel);
    localStorage.setItem('openrouter-image-model', imageModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getCostColor = (cost: string) => {
    if (cost === 'Gratis') return 'text-green-600 bg-green-100';
    if (cost === 'Bajo') return 'text-blue-600 bg-blue-100';
    if (cost === 'Medio') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-gray-700" />
            Configuración
          </h1>
          <p className="text-gray-600 mt-2">
            Configura los modelos de IA para generación de texto e imágenes
          </p>
        </div>

        {/* Text Model Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Modelo de Texto
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Usado para generar ideas y mejorar prompts
          </p>

          <div className="grid gap-3">
            {TEXT_MODELS.map((model) => (
              <label
                key={model.id}
                className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  textModel === model.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="textModel"
                  value={model.id}
                  checked={textModel === model.id}
                  onChange={(e) => setTextModel(e.target.value)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{model.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {model.provider}
                    </span>
                    {model.recommended && (
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded font-medium">
                        Recomendado
                      </span>
                    )}
                    {model.premium && (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded font-medium">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{model.description}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Zap className="w-3 h-3" />
                      {model.speed}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getCostColor(model.cost)}`}>
                      <DollarSign className="w-3 h-3" />
                      {model.cost}
                    </span>
                  </div>
                </div>
                {textModel === model.id && (
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Image Model Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-600" />
            Modelo de Imagen
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Usado para generar diseños
          </p>

          <div className="grid gap-3">
            {IMAGE_MODELS.map((model) => (
              <label
                key={model.id}
                className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  imageModel === model.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <input
                  type="radio"
                  name="imageModel"
                  value={model.id}
                  checked={imageModel === model.id}
                  onChange={(e) => setImageModel(e.target.value)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{model.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {model.provider}
                    </span>
                    {model.recommended && (
                      <span className="text-xs text-pink-600 bg-pink-100 px-2 py-0.5 rounded font-medium">
                        Recomendado
                      </span>
                    )}
                    {model.premium && (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded font-medium">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{model.description}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Zap className="w-3 h-3" />
                      {model.speed}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getCostColor(model.cost)}`}>
                      <DollarSign className="w-3 h-3" />
                      {model.cost}
                    </span>
                  </div>
                </div>
                {imageModel === model.id && (
                  <Check className="w-5 h-5 text-pink-600 flex-shrink-0" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/"
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Guardado
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">Sobre los modelos</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              <strong>Gratis:</strong> Modelos sin costo, ideales para experimentar
            </li>
            <li>
              <strong>Premium:</strong> Mejor calidad pero requieren créditos de OpenRouter
            </li>
            <li>
              Los modelos se guardan en tu navegador y se usarán para futuras generaciones
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
