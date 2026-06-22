'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, Sparkles, Wand2, RotateCcw, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { inputClass } from '@/components/ui/Field';

export default function DesignGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
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
      toast.info('Escribe primero una descripción para poder mejorarla.');
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
        toast.error('No se pudo mejorar el prompt. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('No se pudo mejorar el prompt. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.info('Escribe una descripción para generar la imagen.');
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
        toast.error('No se pudo generar la imagen. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('No se pudo generar la imagen. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !generatedImage) {
      toast.info('Escribe qué quieres cambiar de la imagen.');
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
        toast.error('No se pudo editar la imagen. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error editing image:', error);
      toast.error('No se pudo editar la imagen. Revisa tu conexión e inténtalo de nuevo.');
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
      toast.error('No se pudo descargar la imagen. Inténtalo de nuevo.');
    }
  };

  const handleNewDesign = () => {
    setGeneratedImage('');
    setAiPrompt('');
    setEditPrompt('');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-ink-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Generador de Diseños IA"
          subtitle="Crea diseños únicos con inteligencia artificial"
        />

        {/* Generator Card */}
        <Card className="p-8 mb-8">
          {/* Prompt Input */}
          <div className="mb-6">
            <label htmlFor="ai-prompt" className="block mb-2 text-ink font-bold text-lg">
              Describe tu diseño
            </label>
            <textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Un gato espacial con colores neón, estilo cyberpunk, fondo transparente para camiseta..."
              className={`${inputClass} min-h-[120px] resize-none`}
              disabled={generating || enhancing}
            />
          </div>

          {/* Enhance Instructions */}
          <div className="mb-6">
            <label htmlFor="enhance-instructions" className="block mb-2 text-ink-muted font-medium text-sm">
              Instrucciones para mejorar (opcional)
            </label>
            <input
              id="enhance-instructions"
              type="text"
              value={enhanceInstructions}
              onChange={(e) => setEnhanceInstructions(e.target.value)}
              placeholder="Ej: hazlo más minimalista, añade más detalles, estilo retro..."
              className={inputClass}
              disabled={generating || enhancing}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button
              variant="secondary"
              onClick={handleEnhancePrompt}
              loading={enhancing}
              disabled={enhancing || generating || !aiPrompt.trim()}
              className="py-4 text-lg"
            >
              {enhancing ? (
                'Mejorando...'
              ) : (
                <>
                  <Wand2 className="w-5 h-5" aria-hidden="true" />
                  Mejorar Prompt
                </>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={handleGenerateAI}
              loading={generating}
              disabled={generating || enhancing || !aiPrompt.trim()}
              className="py-4 text-lg"
            >
              {generating ? (
                'Generando...'
              ) : (
                <>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  Generar Imagen
                </>
              )}
            </Button>
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div className="border border-border rounded-card p-6 bg-surface-2" aria-live="polite">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-ink">Imagen Generada</h3>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => handleDownloadImage(generatedImage)}>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Descargar
                  </Button>
                  <Button variant="secondary" onClick={handleNewDesign}>
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Nuevo
                  </Button>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-card p-4 mb-4">
                <img
                  src={generatedImage}
                  alt="Diseño generado con IA"
                  decoding="async"
                  className="max-w-full h-auto mx-auto rounded-card"
                  style={{ maxHeight: '500px', aspectRatio: '1 / 1', objectFit: 'contain' }}
                />
              </div>

              {/* Edit Section */}
              <div className="bg-surface border border-border rounded-card p-4">
                <label htmlFor="edit-prompt" className="block mb-2 text-ink font-medium">
                  Editar imagen
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-prompt"
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Ej: cambia el fondo a azul, añade más brillo..."
                    className={`${inputClass} flex-1`}
                    disabled={generating}
                  />
                  <Button
                    variant="primary"
                    onClick={handleEditImage}
                    loading={generating}
                    disabled={generating || !editPrompt.trim()}
                    className="px-6"
                  >
                    {generating ? '...' : 'Editar'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* History */}
        {generatedImages.length > 0 && (
          <Card className="p-8 mb-8">
            <h3 className="text-xl font-bold text-ink mb-4">Historial de esta sesión</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generatedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Diseño ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-32 object-cover rounded-card cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setGeneratedImage(img)}
                  />
                  <button
                    onClick={() => handleDownloadImage(img)}
                    aria-label={`Descargar diseño ${index + 1}`}
                    className="absolute bottom-2 right-2 bg-panel/70 hover:bg-panel text-on-panel p-2 rounded-btn opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Link to Printful */}
        <div className="text-center">
          <a
            href="https://www.printful.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-ink hover:text-ink-muted font-medium"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Abrir Printful Dashboard para subir diseños
          </a>
        </div>
      </div>
    </div>
  );
}
