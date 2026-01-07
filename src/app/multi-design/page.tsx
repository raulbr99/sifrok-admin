'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles, Download, ArrowLeft, Zap, Award, DollarSign, Brain } from 'lucide-react';
import Link from 'next/link';
import { IMAGE_GENERATION_MODELS, TEXT_GENERATION_MODELS, type ImageGenModel, type TextGenModel } from '@/lib/replicate-models';

interface DesignArea {
  area: string;
  label: string;
  imageUrl: string;
}

const PRODUCT_TYPES = {
  tshirt: { label: 'Camiseta', areas: ['front', 'back'] },
  hoodie: { label: 'Sudadera', areas: ['front', 'back', 'sleeve_left', 'sleeve_right'] },
  pants: { label: 'Pantalón', areas: ['front', 'back'] },
};

export default function MultiDesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [productType, setProductType] = useState<keyof typeof PRODUCT_TYPES>('tshirt');
  const [generating, setGenerating] = useState(false);
  const [designs, setDesigns] = useState<DesignArea[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceInstructions, setEnhanceInstructions] = useState('');
  const [selectedModel, setSelectedModel] = useState<ImageGenModel>('nano-banana-pro');
  const [selectedTextModel, setSelectedTextModel] = useState<TextGenModel>('gemini-2.5-flash');
  const [removeBackground, setRemoveBackground] = useState(false);
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editInstructions, setEditInstructions] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      alert('Por favor escribe una descripción primero');
      return;
    }

    setEnhancing(true);
    try {
      const response = await fetch('/api/admin/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          instructions: enhanceInstructions || 'Make it more detailed and suitable for print design',
          model: selectedTextModel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPrompt(data.enhancedPrompt);
        setEnhanceInstructions('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      alert('Error mejorando el prompt');
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Por favor escribe una descripción para los diseños');
      return;
    }

    setGenerating(true);
    setDesigns([]);

    try {
      const areas = PRODUCT_TYPES[productType].areas;

      const response = await fetch('/api/admin/generate-multi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          productType,
          areas,
          model: selectedModel,
          removeBackground,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDesigns(data.areas);
        alert('¡Diseños generados exitosamente!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating designs:', error);
      alert('Error generando diseños');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, area: string) => {
    try {
      // Usar link directo para evitar problemas de CORS
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `design-${area}-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando imagen:', error);
      alert('Error al descargar la imagen');
    }
  };

  const handleDownloadAll = async () => {
    if (designs.length === 0) {
      alert('No hay diseños para descargar');
      return;
    }

    for (const design of designs) {
      await handleDownload(design.imageUrl, design.area);
      // Esperar un poco entre descargas para evitar bloqueos del navegador
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    alert(`¡${designs.length} diseños descargados! Ahora puedes subirlos manualmente a Gelato.`);
  };

  const handleEditDesign = async (area: string) => {
    if (!editInstructions.trim()) {
      alert('Por favor escribe qué quieres cambiar');
      return;
    }

    const designToEdit = designs.find(d => d.area === area);
    if (!designToEdit) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/edit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: area,
          imageUrl: designToEdit.imageUrl,
          instructions: editInstructions,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar el diseño editado
        setDesigns(prev =>
          prev.map(d =>
            d.area === area
              ? { ...d, imageUrl: data.imageUrl }
              : d
          )
        );
        setEditingArea(null);
        setEditInstructions('');
        alert('¡Diseño editado exitosamente!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error editing design:', error);
      alert('Error editando diseño');
    } finally {
      setGenerating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6 font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Admin
        </Link>

        <h1 className="text-5xl font-black text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Generador Multi-Área
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Genera diseños para diferentes partes de tu prenda automáticamente
        </p>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-8 border-4 border-purple-300 mb-8">
          <h2 className="text-3xl font-black mb-6 text-purple-600 flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            Configuración
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-gray-700 font-bold">
                Tipo de Producto
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as keyof typeof PRODUCT_TYPES)}
                className="w-full p-4 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 font-semibold"
                disabled={generating}
              >
                {Object.entries(PRODUCT_TYPES).map(([key, { label, areas }]) => (
                  <option key={key} value={key}>
                    {label} ({areas.length} áreas)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-bold">
                Modelo de IA
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ImageGenModel)}
                className="w-full p-4 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 font-semibold"
                disabled={generating}
              >
                {Object.entries(IMAGE_GENERATION_MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info del modelo seleccionado */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 mb-2">
                  {IMAGE_GENERATION_MODELS[selectedModel].name}
                  {IMAGE_GENERATION_MODELS[selectedModel].supportsImageInput && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✏️ Soporta edición
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-indigo-700">
                    <Zap className="w-3 h-3" />
                    <span>{IMAGE_GENERATION_MODELS[selectedModel].speed}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-700">
                    <Award className="w-3 h-3" />
                    <span>Calidad: {IMAGE_GENERATION_MODELS[selectedModel].quality}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-700">
                    <DollarSign className="w-3 h-3" />
                    <span>Costo: {IMAGE_GENERATION_MODELS[selectedModel].cost}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-indigo-600">
                    <strong>Ventajas:</strong> {IMAGE_GENERATION_MODELS[selectedModel].strengths.join(', ')}
                  </p>
                </div>
                {!IMAGE_GENERATION_MODELS[selectedModel].supportsImageInput && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Este modelo no soporta edición de imágenes. Usa FLUX o SDXL para editar.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={removeBackground}
                onChange={(e) => setRemoveBackground(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-purple-500"
                disabled={generating}
              />
              <span className="text-gray-700 font-bold">
                Eliminar fondo automáticamente (BRIA RMBG 2.0)
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-1 ml-7">
              Recomendado para diseños de impresión en prendas
            </p>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-700 font-bold">
              Describe tu diseño
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Un gato espacial con colores neón y estilo retro"
              className="w-full p-4 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 min-h-[100px]"
              disabled={generating || enhancing}
            />
            <p className="text-sm text-gray-600 mt-2">
              💡 La IA creará variaciones automáticas para cada área de la prenda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-gray-700 font-bold text-sm">
                ¿Qué mejorar del prompt? (opcional)
              </label>
              <input
                type="text"
                value={enhanceInstructions}
                onChange={(e) => setEnhanceInstructions(e.target.value)}
                placeholder="Ej: hazlo más minimalista, añade más detalles, estilo vintage..."
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                disabled={generating || enhancing}
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-bold text-sm">
                Modelo de Texto para Mejorar
              </label>
              <select
                value={selectedTextModel}
                onChange={(e) => setSelectedTextModel(e.target.value as TextGenModel)}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm font-semibold"
                disabled={generating || enhancing}
              >
                {Object.entries(TEXT_GENERATION_MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info del modelo de texto */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs">
              <Brain className="w-4 h-4 text-blue-700" />
              <div className="flex-1">
                <span className="font-bold text-blue-900">{TEXT_GENERATION_MODELS[selectedTextModel].name}:</span>
                <span className="text-blue-700 ml-2">
                  {TEXT_GENERATION_MODELS[selectedTextModel].strengths.join(', ')}
                </span>
              </div>
              <div className="flex gap-3 text-blue-600">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {TEXT_GENERATION_MODELS[selectedTextModel].speed}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {TEXT_GENERATION_MODELS[selectedTextModel].cost}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={handleEnhancePrompt}
              disabled={enhancing || generating || !prompt.trim()}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-full font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enhancing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Mejorando...
                </span>
              ) : (
                '🚀 Mejorar Prompt'
              )}
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating || enhancing || !prompt.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-full font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generando...
                </span>
              ) : (
                '✨ Generar Diseños'
              )}
            </button>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 Tips para mejores diseños:</strong>
            </p>
            <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
              <li>Sé específico con el estilo: "minimalista", "vintage", "pixel art"</li>
              <li>Menciona colores: "neón", "pastel", "blanco y negro"</li>
              <li>Evita mencionar "camiseta" o "sudadera" en el prompt</li>
              <li>Usa "Mejorar Prompt" para optimizar automáticamente</li>
            </ul>
          </div>
        </div>

        {designs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 border-4 border-purple-200">
            <h2 className="text-3xl font-black mb-6 text-purple-600">
              Diseños Generados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {designs.map((design) => (
                <div
                  key={design.area}
                  className="border-4 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-xl text-purple-700">
                      {design.label}
                    </h3>
                    <div className="flex gap-2">
                      {IMAGE_GENERATION_MODELS[selectedModel].supportsImageInput && (
                        <button
                          onClick={() => setEditingArea(editingArea === design.area ? null : design.area)}
                          className="bg-orange-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all flex items-center gap-2"
                          disabled={generating}
                        >
                          ✏️ Editar
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(design.imageUrl, design.area)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-3">
                    <img
                      src={design.imageUrl}
                      alt={design.label}
                      className="w-full h-auto rounded"
                    />
                  </div>

                  {editingArea === design.area && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 mb-3">
                      <label className="block mb-2 text-sm font-bold text-orange-900">
                        ¿Qué quieres cambiar?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editInstructions}
                          onChange={(e) => setEditInstructions(e.target.value)}
                          placeholder="Ej: cambia el color a azul, añade más detalles..."
                          className="flex-1 p-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                          disabled={generating}
                        />
                        <button
                          onClick={() => handleEditDesign(design.area)}
                          disabled={generating || !editInstructions.trim()}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {generating ? '...' : '🔄 Aplicar'}
                        </button>
                      </div>
                      <p className="text-xs text-orange-700 mt-2">
                        La IA editará esta imagen según tus instrucciones
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 text-center">
                    📍 Se colocará en: <strong>{design.area}</strong>
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownloadAll}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-full font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Descargar Todos los Diseños
              </span>
            </button>

            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>💡 Siguiente paso:</strong> Sube estos diseños manualmente a Gelato Dashboard y configura el producto con las variantes que necesites.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
