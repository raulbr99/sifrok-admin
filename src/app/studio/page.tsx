'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Move,
  Maximize2,
  Palette,
  Shirt,
  Layers,
  Download,
  Save,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  Sparkles,
  Plus,
  X,
  Loader2,
  Wand2,
  Eraser,
  Grid3X3,
  Pipette,
  Check,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

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

  // Extract colors from image
  const extractColorsFromImage = useCallback(async (imageUrl: string) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const sampleSize = 100;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        const colorCounts: Record<string, number> = {};
        let totalValidPixels = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 128) continue;
          if (r > 240 && g > 240 && b > 240) continue;

          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;

          const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          totalValidPixels++;
        }

        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([hex, count], index) => ({
            hex,
            name: `Color ${index + 1}`,
            percentage: Math.round((count / totalValidPixels) * 100),
          }));

        setExtractedColors(sortedColors);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('Error extracting colors:', error);
    }
  }, []);

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

    for (let i = 0; i < totalPlacements; i++) {
      const placementId = currentGarment.placements[i];
      const placementConfig = PLACEMENTS[placementId];

      const placementPrompt = `Create a ${placementConfig.sizeHint} design with TRANSPARENT BACKGROUND or WHITE BACKGROUND.
For ${placementConfig.name} placement on a ${currentGarment.name}.
Theme: ${designPrompt}
Style: cohesive, professional, suitable for print, isolated graphic element with clean edges.`;

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

          // Extract colors from first design
          if (i === 0) {
            extractColorsFromImage(data.imageUrl);
          }
        } else {
          setPlacementDesigns(prev => prev.map(pd =>
            pd.placement === placementId
              ? { ...pd, isGenerating: false }
              : pd
          ));
        }
      } catch (error) {
        console.error(`Error generating for ${placementId}:`, error);
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

    const placementPrompt = `Create a ${placementConfig.sizeHint} design with TRANSPARENT BACKGROUND.
For ${placementConfig.name} placement on a ${currentGarment.name}.
Theme: ${designPrompt}
Style: cohesive, professional, suitable for print.`;

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
      }
    } catch (error) {
      console.error(`Error regenerating ${placementId}:`, error);
      setPlacementDesigns(prev => prev.map(pd =>
        pd.placement === placementId
          ? { ...pd, isGenerating: false }
          : pd
      ));
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
      }
    } catch (error) {
      console.error('Error removing background:', error);
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
        extractColorsFromImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Count completed designs
  const completedDesigns = placementDesigns.filter(pd => pd.imageUrl).length;
  const totalPlacements = currentGarment?.placements.length || 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-purple-600 hover:text-purple-800">
                ← Volver
              </Link>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Shirt className="w-6 h-6 text-purple-600" />
                Design Studio
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {completedDesigns > 0 && (
                <span className="text-sm text-gray-600">
                  {completedDesigns}/{totalPlacements} diseños
                </span>
              )}
              <button
                disabled={completedDesigns === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Guardar Colección
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Step 1: Select Garment & Describe Design */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Garment Selection */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Selecciona el Producto
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {GARMENT_TYPES.map((garment) => (
                  <button
                    key={garment.id}
                    onClick={() => setGarmentType(garment.id)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      garmentType === garment.id
                        ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{garment.icon}</span>
                    <span className="text-xs font-medium">{garment.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {currentGarment?.placements.length} ubicaciones de diseño
              </p>
            </div>

            {/* Right: Design Prompt */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Describe tu Diseño
              </h2>
              <textarea
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                placeholder="Describe el tema de tu diseño... Ej: Estilo japonés minimalista con olas y monte Fuji, colores azul y blanco"
                className="w-full p-4 border-2 border-purple-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:border-purple-500 bg-white text-gray-900"
                disabled={isGenerating}
              />
              {generationError && (
                <p className="text-red-500 text-sm mt-2">{generationError}</p>
              )}
              <button
                onClick={handleGenerateAllDesigns}
                disabled={isGenerating || !designPrompt.trim()}
                className="w-full mt-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generando... {generationProgress}%
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generar Diseño Completo ({currentGarment?.placements.length} ubicaciones)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Placement Grid & Preview */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Placement Designs Grid */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-purple-600" />
                Ubicaciones ({completedDesigns}/{totalPlacements})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {placementDesigns.map((pd) => {
                  const config = PLACEMENTS[pd.placement];
                  const isRemovingBg = removingBgFor === pd.placement;
                  return (
                    <div
                      key={pd.placement}
                      onClick={() => setSelectedPlacement(pd.placement)}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                        selectedPlacement === pd.placement
                          ? 'border-purple-600 ring-2 ring-purple-300'
                          : 'border-gray-200 hover:border-purple-400'
                      }`}
                    >
                      {pd.isGenerating || isRemovingBg ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                          {isRemovingBg && <span className="text-xs text-gray-500 mt-1">Quitando fondo...</span>}
                        </div>
                      ) : pd.imageUrl ? (
                        <img
                          src={pd.imageUrl}
                          alt={config?.name}
                          className="w-full h-full object-contain bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                          <Sparkles className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-medium">
                        {config?.name}
                      </div>
                      {pd.imageUrl && !isRemovingBg && (
                        <>
                          <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBackground(pd.placement);
                            }}
                            className="absolute top-1 left-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1 transition-colors"
                            title="Quitar fondo"
                          >
                            <Eraser className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extracted Colors */}
            {extractedColors.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Pipette className="w-5 h-5 text-purple-600" />
                  Paleta del Diseño
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extractedColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                    >
                      <div
                        className="w-8 h-8 rounded-lg border shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs">
                        <div className="font-mono text-gray-700">{color.hex}</div>
                        <div className="text-gray-500">{color.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Vista Previa</h3>
                <span className="text-xs text-gray-500">
                  {selectedPlacement && PLACEMENTS[selectedPlacement]?.name}
                </span>
              </div>

              {/* Mockup Preview */}
              <div
                className="relative mx-auto rounded-lg overflow-hidden aspect-[3/4] bg-gray-200"
              >
                {/* Design */}
                {selectedDesign?.imageUrl && (
                  <img
                    src={selectedDesign.imageUrl}
                    alt="Design preview"
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
                    className="absolute border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center"
                    style={{
                      left: `${PLACEMENTS[selectedPlacement]?.x}%`,
                      top: `${PLACEMENTS[selectedPlacement]?.y}%`,
                      width: `${PLACEMENTS[selectedPlacement]?.maxWidth}%`,
                      height: '30%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="text-xs text-gray-500">{PLACEMENTS[selectedPlacement]?.name}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right: Selected Design Controls */}
          <div className="lg:col-span-1 space-y-4">
            {selectedPlacement && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">
                  {PLACEMENTS[selectedPlacement]?.name}
                </h3>

                {/* Design Preview */}
                {selectedDesign?.imageUrl ? (
                  <div className="relative mb-4">
                    <img
                      src={selectedDesign.imageUrl}
                      alt="Selected design"
                      className="w-full h-48 object-contain rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
                    <p className="text-gray-500 text-sm">Sin diseño</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleRegeneratePlacement(selectedPlacement)}
                    disabled={!designPrompt.trim() || selectedDesign?.isGenerating}
                    className="w-full p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {selectedDesign?.isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerar
                  </button>

                  <button
                    onClick={() => selectedPlacement && handleRemoveBackground(selectedPlacement)}
                    disabled={!selectedDesign?.imageUrl || removingBgFor === selectedPlacement}
                    className="w-full p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {removingBgFor === selectedPlacement ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eraser className="w-4 h-4" />
                    )}
                    Quitar Fondo
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Subir Imagen
                  </button>

                  {selectedDesign?.imageUrl && (
                    <button
                      onClick={() => setPlacementDesigns(prev => prev.map(pd =>
                        pd.placement === selectedPlacement
                          ? { ...pd, imageUrl: '' }
                          : pd
                      ))}
                      className="w-full p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Collection Name */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Colección
              </h3>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Nombre de la colección..."
                className="w-full p-2 border rounded-lg text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Download All */}
            {completedDesigns > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-purple-600" />
                  Exportar
                </h3>
                <button
                  className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar Todos ({completedDesigns})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
