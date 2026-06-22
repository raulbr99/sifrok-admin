'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Palette,
  Shirt,
  Download,
  Save,
  Sparkles,
  X,
  Loader2,
  Wand2,
  Eraser,
  Grid3X3,
  Pipette,
  Check,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { validateImageForPrint } from '@/actions/studio';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { inputClass } from '@/components/ui/Field';

// Garment types with their placement areas
const GARMENT_TYPES = [
  {
    id: 'tshirt',
    name: 'Camiseta',
    icon: '👕',
    placements: ['front-center', 'front-left', 'back-full', 'back-neck'],
  },
  {
    id: 'hoodie',
    name: 'Sudadera',
    icon: '🧥',
    placements: ['front-center', 'front-left', 'back-full', 'sleeve-left', 'sleeve-right', 'hood'],
  },
  {
    id: 'tanktop',
    name: 'Tank Top',
    icon: '🎽',
    placements: ['front-center', 'back-full'],
  },
  {
    id: 'longsleeve',
    name: 'Manga Larga',
    icon: '👔',
    placements: ['front-center', 'front-left', 'back-full', 'sleeve-left', 'sleeve-right'],
  },
  {
    id: 'sweatshirt',
    name: 'Sudadera Sin Capucha',
    icon: '🧷',
    placements: ['front-center', 'front-left', 'back-full', 'sleeve-left', 'sleeve-right'],
  },
  {
    id: 'polo',
    name: 'Polo',
    icon: '👚',
    placements: ['front-center', 'front-left', 'back-full'],
  },
  {
    id: 'jacket',
    name: 'Chaqueta',
    icon: '🧥',
    placements: ['front-center', 'front-left', 'back-full', 'sleeve-left', 'sleeve-right'],
  },
  {
    id: 'cap',
    name: 'Gorra',
    icon: '🧢',
    placements: ['front-center', 'side-left', 'back-strap'],
  },
  {
    id: 'tote',
    name: 'Tote Bag',
    icon: '👜',
    placements: ['front-center', 'back-center'],
  },
  {
    id: 'mug',
    name: 'Taza',
    icon: '☕',
    placements: ['front-center', 'back-center'],
  },
];

// Placements configuration
const PLACEMENTS: Record<string, { name: string; x: number; y: number; maxWidth: number; sizeHint: string }> = {
  'front-center': { name: 'Frontal Centro', x: 50, y: 40, maxWidth: 80, sizeHint: 'large, bold, main design' },
  'front-left': { name: 'Pecho Izquierdo', x: 30, y: 25, maxWidth: 25, sizeHint: 'small, minimal, icon or logo' },
  'back-full': { name: 'Espalda Completa', x: 50, y: 45, maxWidth: 85, sizeHint: 'large, detailed, statement piece' },
  'back-neck': { name: 'Nuca', x: 50, y: 15, maxWidth: 20, sizeHint: 'small, simple tag or icon' },
  'sleeve-left': { name: 'Manga Izquierda', x: 15, y: 35, maxWidth: 15, sizeHint: 'small, vertical accent' },
  'sleeve-right': { name: 'Manga Derecha', x: 85, y: 35, maxWidth: 15, sizeHint: 'small, vertical accent' },
  'hood': { name: 'Capucha', x: 50, y: 10, maxWidth: 30, sizeHint: 'medium, visible when hood down' },
  'side-left': { name: 'Lado Izquierdo', x: 20, y: 50, maxWidth: 25, sizeHint: 'small side design' },
  'back-strap': { name: 'Correa Trasera', x: 50, y: 80, maxWidth: 20, sizeHint: 'small horizontal design' },
  'back-center': { name: 'Trasero Centro', x: 50, y: 50, maxWidth: 70, sizeHint: 'medium centered design' },
};


interface PlacementDesign {
  placement: string;
  imageUrl: string;
  isGenerating: boolean;
  size: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

interface ExtractedColor {
  hex: string;
  name: string;
  percentage: number;
}

export default function DesignStudioPage() {
  const { toast } = useToast();

  // Core state
  const [garmentType, setGarmentType] = useState('tshirt');
  const [designPrompt, setDesignPrompt] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Placement designs - one design per placement
  const [placementDesigns, setPlacementDesigns] = useState<PlacementDesign[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);

  // Extracted colors from designs
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);

  // Background removal - tracks which placement is being processed
  const [removingBgFor, setRemovingBgFor] = useState<string | null>(null);

  // Collection name
  const [collectionName, setCollectionName] = useState('');

  // Model from settings
  const [imageModel, setImageModel] = useState('google/gemini-2.0-flash-exp:free');

  // Validation state
  const [validationResults, setValidationResults] = useState<Record<string, {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image model from settings
  useEffect(() => {
    const savedImageModel = localStorage.getItem('openrouter-image-model');
    if (savedImageModel) {
      setImageModel(savedImageModel);
    }
  }, []);

  const currentGarment = GARMENT_TYPES.find(g => g.id === garmentType);
  const selectedDesign = placementDesigns.find(pd => pd.placement === selectedPlacement);

  // Initialize placement designs when garment type changes
  useEffect(() => {
    if (currentGarment) {
      const initialDesigns = currentGarment.placements.map(p => ({
        placement: p,
        imageUrl: '',
        isGenerating: false,
        size: 'md',
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      }));
      setPlacementDesigns(initialDesigns);
      setSelectedPlacement(currentGarment.placements[0]);
    }
  }, [garmentType]);

  // Extract colors from all designs
  useEffect(() => {
    const designsWithImages = placementDesigns.filter(pd => pd.imageUrl && !pd.isGenerating);
    if (designsWithImages.length === 0) {
      setExtractedColors([]);
      return;
    }

    const extractColors = async () => {
      const allColorCounts: Record<string, number> = {};
      let totalPixels = 0;

      for (const design of designsWithImages) {
        try {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';

          await new Promise<void>((resolve) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(); return; }

              const sampleSize = 80;
              canvas.width = sampleSize;
              canvas.height = sampleSize;
              ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

              const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
              const pixels = imageData.data;

              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                if (a < 128) continue;
                if (r > 240 && g > 240 && b > 240) continue;
                if (r < 15 && g < 15 && b < 15) continue;

                const qr = Math.round(r / 32) * 32;
                const qg = Math.round(g / 32) * 32;
                const qb = Math.round(b / 32) * 32;

                const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;
                allColorCounts[hex] = (allColorCounts[hex] || 0) + 1;
                totalPixels++;
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = design.imageUrl;
          });
        } catch (error) {
          console.error('Error extracting colors:', error);
        }
      }

      if (totalPixels > 0) {
        const sortedColors = Object.entries(allColorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([hex, count], index) => ({
            hex,
            name: `Color ${index + 1}`,
            percentage: Math.round((count / totalPixels) * 100),
          }));
        setExtractedColors(sortedColors);
      }
    };

    extractColors();
  }, [placementDesigns]);

  // Generate designs for ALL placements
  const handleGenerateAllDesigns = async () => {
    if (!designPrompt.trim()) {
      setGenerationError('Por favor escribe una descripción del diseño');
      return;
    }

    if (!currentGarment) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(0);

    // Mark all as generating
    setPlacementDesigns(prev => prev.map(pd => ({ ...pd, isGenerating: true, imageUrl: '' })));

    const totalPlacements = currentGarment.placements.length;
    let failedCount = 0;

    for (let i = 0; i < totalPlacements; i++) {
      const placementId = currentGarment.placements[i];
      const placementConfig = PLACEMENTS[placementId];

      const placementPrompt = `Create a ${placementConfig.sizeHint} design as an ISOLATED graphic with NO BACKGROUND (transparent PNG).
CRITICAL: The design MUST have NO background at all - completely transparent/cutout style, ready for print-on-demand.
Placement: ${placementConfig.name} on a ${currentGarment.name}.
Theme: ${designPrompt}
Style: Clean vector-like artwork, sharp edges, professional quality, suitable for screen printing or DTG.
Output: Single isolated design element ONLY, no background, no borders, no frames.`;

      try {
        const response = await fetch('/api/admin/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: placementPrompt,
            model: imageModel,
          }),
        });

        const data = await response.json();

        if (response.ok && data.imageUrl) {
          setPlacementDesigns(prev => prev.map(pd =>
            pd.placement === placementId
              ? { ...pd, imageUrl: data.imageUrl, isGenerating: false }
              : pd
          ));
        } else {
          failedCount++;
          setPlacementDesigns(prev => prev.map(pd =>
            pd.placement === placementId
              ? { ...pd, isGenerating: false }
              : pd
          ));
        }
      } catch (error) {
        console.error(`Error generating for ${placementId}:`, error);
        failedCount++;
        setPlacementDesigns(prev => prev.map(pd =>
          pd.placement === placementId
            ? { ...pd, isGenerating: false }
            : pd
        ));
      }

      setGenerationProgress(Math.round(((i + 1) / totalPlacements) * 100));
    }

    setIsGenerating(false);
    setSelectedPlacement(currentGarment.placements[0]);

    if (failedCount === totalPlacements) {
      toast.error('No se pudo generar ningún diseño. Revisa tu conexión e inténtalo de nuevo.');
    } else if (failedCount > 0) {
      toast.error(`${failedCount} de ${totalPlacements} ubicaciones fallaron. Puedes regenerarlas individualmente.`);
    } else {
      toast.success('Diseños generados.');
    }
  };

  // Regenerate single placement
  const handleRegeneratePlacement = async (placementId: string) => {
    if (!designPrompt.trim() || !currentGarment) return;

    const placementConfig = PLACEMENTS[placementId];

    setPlacementDesigns(prev => prev.map(pd =>
      pd.placement === placementId
        ? { ...pd, isGenerating: true }
        : pd
    ));

    const placementPrompt = `Create a ${placementConfig.sizeHint} design as an ISOLATED graphic with NO BACKGROUND (transparent PNG).
CRITICAL: The design MUST have NO background at all - completely transparent/cutout style, ready for print-on-demand.
Placement: ${placementConfig.name} on a ${currentGarment.name}.
Theme: ${designPrompt}
Style: Clean vector-like artwork, sharp edges, professional quality, suitable for screen printing or DTG.
Output: Single isolated design element ONLY, no background, no borders, no frames.`;

    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: placementPrompt,
          model: imageModel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setPlacementDesigns(prev => prev.map(pd =>
          pd.placement === placementId
            ? { ...pd, imageUrl: data.imageUrl, isGenerating: false }
            : pd
        ));
      } else {
        setPlacementDesigns(prev => prev.map(pd =>
          pd.placement === placementId
            ? { ...pd, isGenerating: false }
            : pd
        ));
        toast.error('No se pudo regenerar el diseño. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error(`Error regenerating ${placementId}:`, error);
      setPlacementDesigns(prev => prev.map(pd =>
        pd.placement === placementId
          ? { ...pd, isGenerating: false }
          : pd
      ));
      toast.error('No se pudo regenerar el diseño. Inténtalo de nuevo.');
    }
  };

  // Remove background from a specific placement
  const handleRemoveBackground = async (placementId: string) => {
    const design = placementDesigns.find(pd => pd.placement === placementId);
    if (!design?.imageUrl) return;

    setRemovingBgFor(placementId);

    try {
      const response = await fetch('/api/admin/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: design.imageUrl }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setPlacementDesigns(prev => prev.map(pd =>
          pd.placement === placementId
            ? { ...pd, imageUrl: data.imageUrl }
            : pd
        ));
      } else {
        toast.error('No se pudo quitar el fondo. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('No se pudo quitar el fondo. Inténtalo de nuevo.');
    } finally {
      setRemovingBgFor(null);
    }
  };

  // Upload custom image for selected placement
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPlacement) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setPlacementDesigns(prev => prev.map(pd =>
          pd.placement === selectedPlacement
            ? { ...pd, imageUrl }
            : pd
        ));
        // Colors will be extracted automatically via useEffect
      };
      reader.readAsDataURL(file);
    }
  };

  // Download all designs (one <a download> click per design, with a delay between each)
  const handleDownloadAll = async () => {
    const designsWithImages = placementDesigns.filter(pd => pd.imageUrl);
    if (designsWithImages.length === 0) {
      toast.info('Genera o sube al menos un diseño antes de descargar.');
      return;
    }

    for (const pd of designsWithImages) {
      try {
        const link = document.createElement('a');
        link.href = pd.imageUrl;
        link.download = `design-${pd.placement}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error(`Error descargando ${pd.placement}:`, error);
      }
      // Esperar un poco entre descargas para evitar bloqueos del navegador
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    toast.success(`${designsWithImages.length} diseños descargados.`);
  };

  // Count completed designs
  const completedDesigns = placementDesigns.filter(pd => pd.imageUrl).length;
  const totalPlacements = currentGarment?.placements.length || 0;

  // Validate all designs before saving
  const handleValidateAndSave = async () => {
    const designsWithImages = placementDesigns.filter(pd => pd.imageUrl);
    if (designsWithImages.length === 0) {
      toast.info('Genera o sube al menos un diseño antes de guardar.');
      return;
    }

    setIsValidating(true);
    const results: Record<string, { isValid: boolean; warnings: string[]; errors: string[] }> = {};

    for (const design of designsWithImages) {
      try {
        const validation = await validateImageForPrint(design.imageUrl, design.placement);
        results[design.placement] = validation;
      } catch (error) {
        results[design.placement] = {
          isValid: false,
          warnings: [],
          errors: ['Error al validar la imagen'],
        };
      }
    }

    setValidationResults(results);
    setIsValidating(false);

    // Check if there are any errors
    const hasErrors = Object.values(results).some(r => !r.isValid);
    const hasWarnings = Object.values(results).some(r => r.warnings.length > 0);

    if (hasErrors) {
      setShowValidationModal(true);
    } else if (hasWarnings) {
      // Show warnings but allow to continue
      setShowValidationModal(true);
    } else {
      // All valid, proceed to save
      handleSaveToCollection();
    }
  };

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Save to collection
  const handleSaveToCollection = async () => {
    if (!collectionName.trim()) {
      toast.info('Ponle un nombre a la colección para poder guardarla.');
      return;
    }

    const designsWithImages = placementDesigns.filter(pd => pd.imageUrl);
    if (designsWithImages.length === 0) {
      toast.info('Genera o sube al menos un diseño antes de guardar.');
      return;
    }

    setShowValidationModal(false);
    setIsSaving(true);

    try {
      // 1) Create the collection
      const collectionResponse = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collectionName,
          garmentTypes: [garmentType],
          colors: extractedColors.map(c => ({ hex: c.hex, name: c.name })),
        }),
      });

      if (!collectionResponse.ok) {
        toast.error('No se pudo crear la colección. Inténtalo de nuevo.');
        return;
      }

      const createdCollection = await collectionResponse.json();

      // 2) Create a design for each placement with an image
      let failedDesigns = 0;
      for (const pd of designsWithImages) {
        try {
          const designResponse = await fetch('/api/admin/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: pd.imageUrl,
              name: `${collectionName} - ${pd.placement}`,
              placement: pd.placement,
              size: pd.size,
              collectionId: createdCollection.id,
            }),
          });

          if (!designResponse.ok) {
            failedDesigns++;
          }
        } catch (error) {
          console.error(`Error saving design for ${pd.placement}:`, error);
          failedDesigns++;
        }
      }

      if (failedDesigns === designsWithImages.length) {
        toast.error('La colección se creó pero no se pudo guardar ningún diseño.');
      } else if (failedDesigns > 0) {
        toast.error(`Colección guardada, pero ${failedDesigns} diseños fallaron.`);
      } else {
        toast.success('Colección guardada.');
      }
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('No se pudo guardar la colección. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-ink-muted hover:text-ink">
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
                <Shirt className="w-6 h-6 text-ink" aria-hidden="true" />
                Design Studio
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {completedDesigns > 0 && (
                <span className="text-sm text-ink-muted">
                  {completedDesigns}/{totalPlacements} diseños
                </span>
              )}
              <Button
                variant="primary"
                onClick={handleValidateAndSave}
                disabled={completedDesigns === 0 || isValidating || isSaving}
                loading={isValidating || isSaving}
              >
                {isValidating ? (
                  'Validando...'
                ) : isSaving ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    Guardar Coleccion
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Step 1: Select Garment & Describe Design */}
        <Card className="p-6 mb-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Garment Selection */}
            <div>
              <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <span className="bg-accent text-accent-ink w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold" aria-hidden="true">1</span>
                Selecciona el Producto
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {GARMENT_TYPES.map((garment) => (
                  <button
                    key={garment.id}
                    onClick={() => setGarmentType(garment.id)}
                    className={`p-3 rounded-btn text-center transition-colors border ${
                      garmentType === garment.id
                        ? 'bg-accent text-accent-ink border-accent'
                        : 'bg-surface-2 text-ink-muted border-border hover:bg-surface'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{garment.icon}</span>
                    <span className="text-xs font-medium">{garment.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-subtle mt-2">
                {currentGarment?.placements.length} ubicaciones de diseño
              </p>
            </div>

            {/* Right: Design Prompt */}
            <div>
              <h2 id="design-prompt-heading" className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <span className="bg-accent text-accent-ink w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold" aria-hidden="true">2</span>
                Describe tu Diseño
              </h2>
              <label htmlFor="design-prompt" className="sr-only">
                Descripción del diseño
              </label>
              <textarea
                id="design-prompt"
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                placeholder="Describe el tema de tu diseño... Ej: Estilo japonés minimalista con olas y monte Fuji, colores azul y blanco"
                className={`${inputClass} resize-none h-24`}
                disabled={isGenerating}
                aria-invalid={generationError ? true : undefined}
                aria-describedby={generationError ? 'design-prompt-error' : undefined}
              />
              {generationError && (
                <p id="design-prompt-error" role="alert" className="text-danger text-sm mt-2">{generationError}</p>
              )}
              <Button
                variant="primary"
                onClick={handleGenerateAllDesigns}
                disabled={isGenerating || !designPrompt.trim()}
                loading={isGenerating}
                className="w-full mt-3 py-4 text-base"
              >
                {isGenerating ? (
                  <>Generando... {generationProgress}%</>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" aria-hidden="true" />
                    Generar Diseño Completo ({currentGarment?.placements.length} ubicaciones)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content: Placement Grid & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Placement Designs Grid */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-ink" aria-hidden="true" />
                Ubicaciones ({completedDesigns}/{totalPlacements})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {placementDesigns.map((pd) => {
                  const config = PLACEMENTS[pd.placement];
                  const isRemovingBg = removingBgFor === pd.placement;
                  return (
                    <div
                      key={pd.placement}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedPlacement === pd.placement}
                      aria-label={`Seleccionar ubicación ${config?.name ?? pd.placement}`}
                      onClick={() => setSelectedPlacement(pd.placement)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPlacement(pd.placement);
                        }
                      }}
                      className={`relative aspect-square rounded-card border-2 overflow-hidden cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        selectedPlacement === pd.placement
                          ? 'border-ink'
                          : 'border-border hover:border-border-strong'
                      }`}
                    >
                      {pd.isGenerating || isRemovingBg ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-2" role="status" aria-live="polite">
                          <Loader2 className="w-8 h-8 animate-spin text-ink" aria-hidden="true" />
                          {isRemovingBg
                            ? <span className="text-xs text-ink-muted mt-1">Quitando fondo...</span>
                            : <span className="sr-only">Generando diseño…</span>}
                        </div>
                      ) : pd.imageUrl ? (
                        <img
                          src={pd.imageUrl}
                          alt={config?.name ? `Diseño para ${config.name}` : 'Diseño generado'}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-2 text-ink-subtle">
                          <Sparkles className="w-8 h-8" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-panel/80 text-on-panel text-xs text-center py-1 font-medium">
                        {config?.name}
                      </div>
                      {pd.imageUrl && !isRemovingBg && (
                        <>
                          <div className="absolute top-1 right-1 bg-success text-on-panel rounded-full p-0.5">
                            <Check className="w-3 h-3" aria-hidden="true" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBackground(pd.placement);
                            }}
                            className="absolute top-1 left-1 bg-accent hover:bg-accent-hover text-accent-ink rounded-full p-1.5 transition-colors"
                            title="Quitar fondo"
                            aria-label="Quitar fondo"
                          >
                            <Eraser className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Extracted Colors */}
            {extractedColors.length > 0 && (
              <Card className="p-4">
                <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                  <Pipette className="w-5 h-5 text-ink" aria-hidden="true" />
                  Paleta del Diseño
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extractedColors.map((color, index) => (
                    <div
                      key={`${color.hex}-${index}`}
                      className="flex items-center gap-2 bg-surface-2 border border-border rounded-btn p-2"
                    >
                      <div
                        className="w-8 h-8 rounded-btn border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs">
                        <div className="font-mono text-ink-muted">{color.hex}</div>
                        <div className="text-ink-subtle">{color.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Center: Preview */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-ink">Vista Previa</h3>
                <span className="text-xs text-ink-subtle">
                  {selectedPlacement && PLACEMENTS[selectedPlacement]?.name}
                </span>
              </div>

              {/* Mockup Preview */}
              <div
                className="relative mx-auto rounded-card overflow-hidden aspect-[3/4] bg-surface-2"
              >
                {/* Design */}
                {selectedDesign?.imageUrl && (
                  <img
                    src={selectedDesign.imageUrl}
                    alt={selectedPlacement ? `Vista previa del diseño en ${PLACEMENTS[selectedPlacement]?.name}` : 'Vista previa del diseño'}
                    loading="eager"
                    decoding="async"
                    className="absolute object-contain pointer-events-none"
                    style={{
                      left: `${PLACEMENTS[selectedPlacement!]?.x}%`,
                      top: `${PLACEMENTS[selectedPlacement!]?.y}%`,
                      width: `${PLACEMENTS[selectedPlacement!]?.maxWidth}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}

                {/* Placement guide when no design */}
                {!selectedDesign?.imageUrl && selectedPlacement && (
                  <div
                    className="absolute border-2 border-dashed border-border-strong rounded-card flex items-center justify-center"
                    style={{
                      left: `${PLACEMENTS[selectedPlacement]?.x}%`,
                      top: `${PLACEMENTS[selectedPlacement]?.y}%`,
                      width: `${PLACEMENTS[selectedPlacement]?.maxWidth}%`,
                      height: '30%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="text-xs text-ink-subtle">{PLACEMENTS[selectedPlacement]?.name}</span>
                  </div>
                )}
              </div>

            </Card>
          </div>

          {/* Right: Selected Design Controls */}
          <div className="lg:col-span-1 space-y-4">
            {selectedPlacement && (
              <Card className="p-4">
                <h3 className="font-bold text-ink mb-3">
                  {PLACEMENTS[selectedPlacement]?.name}
                </h3>

                {/* Design Preview */}
                {selectedDesign?.imageUrl ? (
                  <div className="relative mb-4">
                    <img
                      src={selectedDesign.imageUrl}
                      alt={selectedPlacement ? `Diseño seleccionado para ${PLACEMENTS[selectedPlacement]?.name}` : 'Diseño seleccionado'}
                      loading="eager"
                      decoding="async"
                      className="w-full h-48 object-contain rounded-card bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-surface-2 rounded-card mb-4">
                    <p className="text-ink-subtle text-sm">Sin diseño</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleRegeneratePlacement(selectedPlacement)}
                    disabled={!designPrompt.trim() || selectedDesign?.isGenerating}
                    loading={selectedDesign?.isGenerating}
                    className="w-full"
                  >
                    {!selectedDesign?.isGenerating && <RefreshCw className="w-4 h-4" aria-hidden="true" />}
                    Regenerar
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => selectedPlacement && handleRemoveBackground(selectedPlacement)}
                    disabled={!selectedDesign?.imageUrl || removingBgFor === selectedPlacement}
                    loading={removingBgFor === selectedPlacement}
                    className="w-full"
                  >
                    {removingBgFor !== selectedPlacement && <Eraser className="w-4 h-4" aria-hidden="true" />}
                    Quitar Fondo
                  </Button>

                  <input
                    id="placement-image-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    aria-label="Subir imagen para la ubicación seleccionada"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    Subir Imagen
                  </Button>

                  {selectedDesign?.imageUrl && (
                    <Button
                      variant="danger"
                      onClick={() => setPlacementDesigns(prev => prev.map(pd =>
                        pd.placement === selectedPlacement
                          ? { ...pd, imageUrl: '' }
                          : pd
                      ))}
                      className="w-full"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Collection Name */}
            <Card className="p-4">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-ink" aria-hidden="true" />
                Colección
              </h3>
              <label htmlFor="collection-name" className="sr-only">
                Nombre de la colección
              </label>
              <input
                id="collection-name"
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Nombre de la colección..."
                className={inputClass}
              />
            </Card>

            {/* Download All */}
            {completedDesigns > 0 && (
              <Card className="p-4">
                <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-ink" aria-hidden="true" />
                  Exportar
                </h3>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDownloadAll}
                  className="w-full py-3"
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                  Descargar Todos ({completedDesigns})
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      <Modal
        open={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validacion de Disenios"
        size="md"
      >
        <div className="space-y-4">
          {Object.entries(validationResults).map(([placement, result]) => (
            <div
              key={placement}
              className={`p-4 rounded-card border border-border ${
                !result.isValid
                  ? 'bg-danger-bg'
                  : result.warnings.length > 0
                  ? 'bg-warning-bg'
                  : 'bg-success-bg'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {!result.isValid ? (
                  <AlertCircle className="w-5 h-5 text-danger" aria-hidden="true" />
                ) : result.warnings.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
                )}
                <span className="font-medium text-ink">
                  {PLACEMENTS[placement]?.name || placement}
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-2" role="alert">
                  {result.errors.map((error, i) => (
                    <p key={i} className="text-sm text-danger">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mt-2">
                  {result.warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-warning">
                      {warning}
                    </p>
                  ))}
                </div>
              )}

              {result.isValid && result.warnings.length === 0 && (
                <p className="text-sm text-success">Imagen valida para impresion</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowValidationModal(false)}
          >
            Cancelar
          </Button>
          {Object.values(validationResults).every(r => r.isValid) && (
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveToCollection}
            >
              Guardar de todas formas
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
