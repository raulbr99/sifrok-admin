'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, Sparkles, Wand2, RotateCcw, ExternalLink } from 'lucide-react';

export default function DesignGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceInstructions, setEnhanceInstructions] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageModel, setImageModel] = useState<string>('google/gemini-2.0-flash-exp:free');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Load pending prompt from ideas page and settings
  useEffect(() => {
    const pendingPrompt = localStorage.getItem('pending-prompt');
    if (pendingPrompt) {
      setAiPrompt(pendingPrompt);
      localStorage.removeItem('pending-prompt');
    }
    const savedModel = localStorage.getItem('openrouter-image-model');
    if (savedModel) {
      setImageModel(savedModel);
    }
  }, []);

  const handleEnhancePrompt = async () => {
    if (!aiPrompt.trim()) {
      alert('Por favor escribe una descripción primero');
      return;
    }

    setEnhancing(true);
    try {
      const response = await fetch('/api/admin/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          instructions: enhanceInstructions
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiPrompt(data.enhancedPrompt);
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

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Por favor escribe una descripción para generar la imagen');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          image: generatedImage || undefined,
          model: imageModel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedImage(data.imageUrl);
        const updatedImages = [data.imageUrl, ...generatedImages].slice(0, 20);
        setGeneratedImages(updatedImages);
        // Save to localStorage for Studio access
        localStorage.setItem('generated-images', JSON.stringify(updatedImages));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generando imagen con IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !generatedImage) {
      alert('Por favor escribe qué quieres cambiar de la imagen');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt,
          image: generatedImage,
          model: imageModel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedImage(data.imageUrl);
        setGeneratedImages(prev => [data.imageUrl, ...prev].slice(0, 20));
        setEditPrompt('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert('Error editando imagen con IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sifrok-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando imagen:', error);
      alert('Error al descargar la imagen');
    }
  };

  const handleNewDesign = () => {
    setGeneratedImage('');
    setAiPrompt('');
    setEditPrompt('');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Generador de Diseños IA
          </h1>
          <p className="text-gray-600">Crea diseños únicos con inteligencia artificial</p>
        </div>

        {/* Generator Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block mb-2 text-gray-700 font-bold text-lg">
              Describe tu diseño
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Un gato espacial con colores neón, estilo cyberpunk, fondo transparente para camiseta..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 min-h-[120px] text-gray-900 bg-white resize-none"
              disabled={generating || enhancing}
            />
          </div>

          {/* Enhance Instructions */}
          <div className="mb-6">
            <label className="block mb-2 text-gray-600 font-medium text-sm">
              Instrucciones para mejorar (opcional)
            </label>
            <input
              type="text"
              value={enhanceInstructions}
              onChange={(e) => setEnhanceInstructions(e.target.value)}
              placeholder="Ej: hazlo más minimalista, añade más detalles, estilo retro..."
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 bg-white"
              disabled={generating || enhancing}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleEnhancePrompt}
              disabled={enhancing || generating || !aiPrompt.trim()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enhancing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Mejorando...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Mejorar Prompt
                </>
              )}
            </button>

            <button
              onClick={handleGenerateAI}
              disabled={generating || enhancing || !aiPrompt.trim()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generar Imagen
                </>
              )}
            </button>
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Imagen Generada</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadImage(generatedImage)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                  <button
                    onClick={handleNewDesign}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Nuevo
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4">
                <img
                  src={generatedImage}
                  alt="Generated design"
                  className="max-w-full h-auto mx-auto rounded-lg"
                  style={{ maxHeight: '500px' }}
                />
              </div>

              {/* Edit Section */}
              <div className="bg-white rounded-lg p-4">
                <label className="block mb-2 text-gray-700 font-medium">
                  Editar imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Ej: cambia el fondo a azul, añade más brillo..."
                    className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 bg-white"
                    disabled={generating}
                  />
                  <button
                    onClick={handleEditImage}
                    disabled={generating || !editPrompt.trim()}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? '...' : 'Editar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {generatedImages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Historial de esta sesión</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {generatedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Design ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setGeneratedImage(img)}
                  />
                  <button
                    onClick={() => handleDownloadImage(img)}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Link to Gelato */}
        <div className="text-center">
          <a
            href="https://dashboard.gelato.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Gelato Dashboard para subir diseños
          </a>
        </div>
      </div>
    </div>
  );
}
