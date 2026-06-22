'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles, Download, ArrowLeft, Zap, Award, DollarSign, Brain, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { IMAGE_GENERATION_MODELS, TEXT_GENERATION_MODELS, type ImageGenModel, type TextGenModel } from '@/lib/replicate-models';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Field, { inputClass } from '@/components/ui/Field';
import PageHeader from '@/components/ui/PageHeader';

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
  const { toast } = useToast();
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
  const [savingDesigns, setSavingDesigns] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.info('Escribe una descripción antes de mejorar el prompt.');
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
        toast.error(`No se pudo mejorar el prompt. ${data.error ?? 'Inténtalo de nuevo.'}`);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('No se pudo mejorar el prompt. Inténtalo de nuevo.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.info('Escribe una descripción para generar los diseños.');
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
        toast.success('Diseños generados.');
      } else {
        toast.error(`No se pudieron generar los diseños. ${data.error ?? 'Inténtalo de nuevo.'}`);
      }
    } catch (error) {
      console.error('Error generating designs:', error);
      toast.error('No se pudieron generar los diseños. Inténtalo de nuevo.');
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
      toast.error('No se pudo descargar la imagen. Inténtalo de nuevo.');
    }
  };

  const handleDownloadAll = async () => {
    if (designs.length === 0) {
      toast.info('Genera algún diseño antes de descargar.');
      return;
    }

    for (const design of designs) {
      await handleDownload(design.imageUrl, design.area);
      // Esperar un poco entre descargas para evitar bloqueos del navegador
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast.success(`${designs.length} diseños descargados. Ya puedes subirlos a Printful.`);
  };

  const handleSaveDesigns = async () => {
    if (designs.length === 0) {
      toast.info('Genera algún diseño antes de guardar.');
      return;
    }

    setSavingDesigns(true);
    try {
      const results = await Promise.all(
        designs.map((d) =>
          fetch('/api/admin/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: d.imageUrl,
              name: `${prompt?.slice(0, 40)} - ${d.label}`,
              prompt,
              placement: d.area,
            }),
          })
        )
      );

      const failed = results.filter((r) => !r.ok).length;

      if (failed === 0) {
        toast.success(`${designs.length} diseños guardados.`);
      } else if (failed < designs.length) {
        toast.error(`Se guardaron ${designs.length - failed} de ${designs.length} diseños.`);
      } else {
        toast.error('No se pudieron guardar los diseños. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error saving designs:', error);
      toast.error('No se pudieron guardar los diseños. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSavingDesigns(false);
    }
  };

  const handleEditDesign = async (area: string) => {
    if (!editInstructions.trim()) {
      toast.info('Escribe qué quieres cambiar del diseño.');
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
        toast.success('Diseño actualizado.');
      } else {
        toast.error(`No se pudo editar el diseño. ${data.error ?? 'Inténtalo de nuevo.'}`);
      }
    } catch (error) {
      console.error('Error editing design:', error);
      toast.error('No se pudo editar el diseño. Inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-ink mx-auto mb-4" aria-hidden="true" />
          <p className="text-ink-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Volver al Admin
        </Link>

        <PageHeader
          title="Generador Multi-Área"
          subtitle="Genera diseños para diferentes partes de tu prenda automáticamente"
          icon={Sparkles}
        />

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-ink flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-ink" aria-hidden="true" />
            Configuración
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Tipo de Producto" htmlFor="product-type">
              <select
                id="product-type"
                value={productType}
                onChange={(e) => setProductType(e.target.value as keyof typeof PRODUCT_TYPES)}
                className={inputClass}
                disabled={generating}
              >
                {Object.entries(PRODUCT_TYPES).map(([key, { label, areas }]) => (
                  <option key={key} value={key}>
                    {label} ({areas.length} áreas)
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Modelo de IA" htmlFor="image-model">
              <select
                id="image-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ImageGenModel)}
                className={inputClass}
                disabled={generating}
              >
                {Object.entries(IMAGE_GENERATION_MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Info del modelo seleccionado */}
          <div className="mb-6 bg-surface-2 border border-border rounded-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-ink mb-2 flex items-center gap-2">
                  {IMAGE_GENERATION_MODELS[selectedModel].name}
                  {IMAGE_GENERATION_MODELS[selectedModel].supportsImageInput && (
                    <Badge tone="success">
                      ✏️ Soporta edición
                    </Badge>
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-ink-muted">
                    <Zap className="w-3 h-3" aria-hidden="true" />
                    <span>{IMAGE_GENERATION_MODELS[selectedModel].speed}</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-muted">
                    <Award className="w-3 h-3" aria-hidden="true" />
                    <span>Calidad: {IMAGE_GENERATION_MODELS[selectedModel].quality}</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-muted">
                    <DollarSign className="w-3 h-3" aria-hidden="true" />
                    <span>Costo: {IMAGE_GENERATION_MODELS[selectedModel].cost}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-ink-muted">
                    <strong>Ventajas:</strong> {IMAGE_GENERATION_MODELS[selectedModel].strengths.join(', ')}
                  </p>
                </div>
                {!IMAGE_GENERATION_MODELS[selectedModel].supportsImageInput && (
                  <p className="text-xs text-warning mt-2">
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
                className="w-5 h-5 accent-accent border border-border-strong rounded-btn"
                disabled={generating}
              />
              <span className="text-ink font-medium">
                Eliminar fondo automáticamente (BRIA RMBG 2.0)
              </span>
            </label>
            <p className="text-xs text-ink-muted mt-1 ml-7">
              Recomendado para diseños de impresión en prendas
            </p>
          </div>

          <Field label="Describe tu diseño" htmlFor="design-prompt" className="mb-6"
            hint="💡 La IA creará variaciones automáticas para cada área de la prenda">
            <textarea
              id="design-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Un gato espacial con colores neón y estilo retro"
              className={`${inputClass} min-h-[100px]`}
              disabled={generating || enhancing}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="¿Qué mejorar del prompt? (opcional)" htmlFor="enhance-instructions">
              <input
                id="enhance-instructions"
                type="text"
                value={enhanceInstructions}
                onChange={(e) => setEnhanceInstructions(e.target.value)}
                placeholder="Ej: hazlo más minimalista, añade más detalles, estilo vintage..."
                className={inputClass}
                disabled={generating || enhancing}
              />
            </Field>

            <Field label="Modelo de Texto para Mejorar" htmlFor="text-model">
              <select
                id="text-model"
                value={selectedTextModel}
                onChange={(e) => setSelectedTextModel(e.target.value as TextGenModel)}
                className={inputClass}
                disabled={generating || enhancing}
              >
                {Object.entries(TEXT_GENERATION_MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Info del modelo de texto */}
          <div className="mb-6 bg-surface-2 border border-border rounded-card p-3">
            <div className="flex items-center gap-2 text-xs">
              <Brain className="w-4 h-4 text-ink-muted" aria-hidden="true" />
              <div className="flex-1">
                <span className="font-bold text-ink">{TEXT_GENERATION_MODELS[selectedTextModel].name}:</span>
                <span className="text-ink-muted ml-2">
                  {TEXT_GENERATION_MODELS[selectedTextModel].strengths.join(', ')}
                </span>
              </div>
              <div className="flex gap-3 text-ink-muted">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" aria-hidden="true" />
                  {TEXT_GENERATION_MODELS[selectedTextModel].speed}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" aria-hidden="true" />
                  {TEXT_GENERATION_MODELS[selectedTextModel].cost}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleEnhancePrompt}
              disabled={enhancing || generating || !prompt.trim()}
              loading={enhancing}
              aria-label="Mejorar prompt"
              className="w-full"
            >
              {enhancing ? 'Mejorando...' : '🚀 Mejorar Prompt'}
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleGenerate}
              disabled={generating || enhancing || !prompt.trim()}
              loading={generating}
              aria-label="Generar diseños"
              className="w-full"
            >
              {generating ? 'Generando...' : '✨ Generar Diseños'}
            </Button>
          </div>

          <div className="bg-info-bg border border-border rounded-card p-4">
            <p className="text-sm text-ink mb-2">
              <strong>💡 Tips para mejores diseños:</strong>
            </p>
            <ul className="text-xs text-ink-muted space-y-1 ml-4 list-disc">
              <li>Sé específico con el estilo: "minimalista", "vintage", "pixel art"</li>
              <li>Menciona colores: "neón", "pastel", "blanco y negro"</li>
              <li>Evita mencionar "camiseta" o "sudadera" en el prompt</li>
              <li>Usa "Mejorar Prompt" para optimizar automáticamente</li>
            </ul>
          </div>
        </Card>

        {designs.length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-ink">
              Diseños Generados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {designs.map((design) => (
                <div
                  key={design.area}
                  className="border border-border rounded-card p-4 bg-surface-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-xl text-ink">
                      {design.label}
                    </h3>
                    <div className="flex gap-2">
                      {IMAGE_GENERATION_MODELS[selectedModel].supportsImageInput && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingArea(editingArea === design.area ? null : design.area)}
                          disabled={generating}
                          aria-label={`Editar diseño de ${design.label}`}
                        >
                          ✏️ Editar
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(design.imageUrl, design.area)}
                        aria-label={`Descargar diseño de ${design.label}`}
                      >
                        <Download className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-card p-4 mb-3">
                    <img
                      src={design.imageUrl}
                      alt={`Diseño generado para ${design.label}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto rounded-card"
                    />
                  </div>

                  {editingArea === design.area && (
                    <div className="bg-warning-bg border border-border rounded-card p-4 mb-3">
                      <label htmlFor={`edit-instructions-${design.area}`} className="block mb-2 text-sm font-medium text-ink">
                        ¿Qué quieres cambiar?
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={`edit-instructions-${design.area}`}
                          type="text"
                          value={editInstructions}
                          onChange={(e) => setEditInstructions(e.target.value)}
                          placeholder="Ej: cambia el color a azul, añade más detalles..."
                          className={`${inputClass} flex-1`}
                          disabled={generating}
                        />
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => handleEditDesign(design.area)}
                          disabled={generating || !editInstructions.trim()}
                          aria-label={`Aplicar cambios al diseño de ${design.label}`}
                          className="whitespace-nowrap"
                        >
                          {generating ? '...' : '🔄 Aplicar'}
                        </Button>
                      </div>
                      <p className="text-xs text-ink-muted mt-2">
                        La IA editará esta imagen según tus instrucciones
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-ink-muted text-center">
                    📍 Se colocará en: <strong>{design.area}</strong>
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                type="button"
                variant="primary"
                onClick={handleDownloadAll}
                className="w-full"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                Descargar Todos los Diseños
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDesigns}
                loading={savingDesigns}
                disabled={savingDesigns}
                className="w-full"
              >
                <Save className="w-5 h-5" aria-hidden="true" />
                {savingDesigns ? 'Guardando...' : 'Guardar diseños'}
              </Button>
            </div>

            <div className="mt-4 bg-info-bg border border-border rounded-card p-4">
              <p className="text-sm text-ink">
                <strong>💡 Siguiente paso:</strong> Sube estos diseños manualmente a Printful Dashboard y configura el producto con las variantes que necesites.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
