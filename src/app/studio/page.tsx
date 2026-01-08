'use client';

import { useState, useRef, useEffect } from 'react';
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
  Eye,
  Sparkles,
  FolderOpen,
  Plus,
  X,
  Check,
  Loader2,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';

// Garment types with their placement areas - EXPANDED
const GARMENT_TYPES = [
  {
    id: 'tshirt',
    name: 'Camiseta',
    icon: '👕',
    placements: ['front-center', 'front-left', 'front-right', 'back-full', 'back-neck', 'back-lower'],
  },
  {
    id: 'hoodie',
    name: 'Sudadera',
    icon: '🧥',
    placements: ['front-center', 'front-left', 'front-right', 'back-full', 'back-neck', 'sleeve-left', 'sleeve-right', 'hood'],
  },
  {
    id: 'tanktop',
    name: 'Tank Top',
    icon: '🎽',
    placements: ['front-center', 'front-left', 'back-full'],
  },
  {
    id: 'longsleeve',
    name: 'Manga Larga',
    icon: '👔',
    placements: ['front-center', 'front-left', 'front-right', 'back-full', 'back-neck', 'sleeve-left', 'sleeve-right'],
  },
  {
    id: 'sweatshirt',
    name: 'Sudadera Sin Capucha',
    icon: '🧷',
    placements: ['front-center', 'front-left', 'front-right', 'back-full', 'back-neck', 'sleeve-left', 'sleeve-right'],
  },
  {
    id: 'polo',
    name: 'Polo',
    icon: '👚',
    placements: ['front-center', 'front-left', 'back-full', 'back-neck'],
  },
  {
    id: 'jacket',
    name: 'Chaqueta',
    icon: '🧥',
    placements: ['front-center', 'front-left', 'front-right', 'back-full', 'sleeve-left', 'sleeve-right'],
  },
  {
    id: 'pants',
    name: 'Pantalón',
    icon: '👖',
    placements: ['front-left-leg', 'front-right-leg', 'back-pocket'],
  },
  {
    id: 'shorts',
    name: 'Shorts',
    icon: '🩳',
    placements: ['front-left-leg', 'front-right-leg', 'back-pocket'],
  },
  {
    id: 'cap',
    name: 'Gorra',
    icon: '🧢',
    placements: ['front-center', 'side-left', 'side-right', 'back-strap'],
  },
  {
    id: 'beanie',
    name: 'Gorro',
    icon: '🎿',
    placements: ['front-center', 'fold-up'],
  },
  {
    id: 'tote',
    name: 'Tote Bag',
    icon: '👜',
    placements: ['front-center', 'back-center'],
  },
  {
    id: 'backpack',
    name: 'Mochila',
    icon: '🎒',
    placements: ['front-pocket', 'back-panel', 'side-pocket'],
  },
  {
    id: 'mug',
    name: 'Taza',
    icon: '☕',
    placements: ['wrap-around', 'front-center', 'back-center'],
  },
  {
    id: 'phone-case',
    name: 'Funda Móvil',
    icon: '📱',
    placements: ['full-back'],
  },
  {
    id: 'poster',
    name: 'Póster',
    icon: '🖼️',
    placements: ['full-print'],
  },
  {
    id: 'sticker',
    name: 'Sticker',
    icon: '🏷️',
    placements: ['full-print'],
  },
];

// Extended placements configuration
const PLACEMENTS = {
  // Front placements
  'front-center': { name: 'Frontal Centro', x: 50, y: 40, maxWidth: 80 },
  'front-left': { name: 'Pecho Izquierdo', x: 30, y: 25, maxWidth: 25 },
  'front-right': { name: 'Pecho Derecho', x: 70, y: 25, maxWidth: 25 },
  // Back placements
  'back-full': { name: 'Espalda Completa', x: 50, y: 45, maxWidth: 85 },
  'back-neck': { name: 'Nuca', x: 50, y: 15, maxWidth: 20 },
  'back-lower': { name: 'Espalda Baja', x: 50, y: 75, maxWidth: 30 },
  'back-pocket': { name: 'Bolsillo Trasero', x: 50, y: 20, maxWidth: 15 },
  // Sleeve placements
  'sleeve-left': { name: 'Manga Izquierda', x: 15, y: 35, maxWidth: 15 },
  'sleeve-right': { name: 'Manga Derecha', x: 85, y: 35, maxWidth: 15 },
  // Hoodie specific
  'hood': { name: 'Capucha', x: 50, y: 10, maxWidth: 30 },
  // Pants/Shorts
  'front-left-leg': { name: 'Pierna Izquierda', x: 35, y: 30, maxWidth: 20 },
  'front-right-leg': { name: 'Pierna Derecha', x: 65, y: 30, maxWidth: 20 },
  // Caps/Hats
  'side-left': { name: 'Lado Izquierdo', x: 20, y: 50, maxWidth: 25 },
  'side-right': { name: 'Lado Derecho', x: 80, y: 50, maxWidth: 25 },
  'back-strap': { name: 'Correa Trasera', x: 50, y: 80, maxWidth: 20 },
  'fold-up': { name: 'Doblez', x: 50, y: 70, maxWidth: 60 },
  // Bags
  'front-pocket': { name: 'Bolsillo Frontal', x: 50, y: 60, maxWidth: 40 },
  'back-panel': { name: 'Panel Trasero', x: 50, y: 50, maxWidth: 70 },
  'side-pocket': { name: 'Bolsillo Lateral', x: 85, y: 50, maxWidth: 15 },
  'back-center': { name: 'Trasero Centro', x: 50, y: 50, maxWidth: 70 },
  // Full prints
  'wrap-around': { name: 'Envolvente', x: 50, y: 50, maxWidth: 100 },
  'full-back': { name: 'Trasera Completa', x: 50, y: 50, maxWidth: 95 },
  'full-print': { name: 'Impresión Completa', x: 50, y: 50, maxWidth: 100 },
};

const GARMENT_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#FFFFFF', textColor: 'dark' },
  { id: 'black', name: 'Negro', hex: '#1a1a1a', textColor: 'light' },
  { id: 'navy', name: 'Azul Marino', hex: '#1e3a5f', textColor: 'light' },
  { id: 'red', name: 'Rojo', hex: '#dc2626', textColor: 'light' },
  { id: 'gray', name: 'Gris', hex: '#6b7280', textColor: 'light' },
  { id: 'forest', name: 'Verde Bosque', hex: '#166534', textColor: 'light' },
  { id: 'purple', name: 'Púrpura', hex: '#7c3aed', textColor: 'light' },
  { id: 'sand', name: 'Arena', hex: '#d4c4a8', textColor: 'dark' },
  { id: 'pink', name: 'Rosa', hex: '#ec4899', textColor: 'light' },
  { id: 'skyblue', name: 'Celeste', hex: '#38bdf8', textColor: 'dark' },
  { id: 'olive', name: 'Oliva', hex: '#556b2f', textColor: 'light' },
  { id: 'burgundy', name: 'Borgoña', hex: '#800020', textColor: 'light' },
  { id: 'teal', name: 'Verde Azulado', hex: '#008080', textColor: 'light' },
  { id: 'coral', name: 'Coral', hex: '#ff7f50', textColor: 'dark' },
  { id: 'lavender', name: 'Lavanda', hex: '#e6e6fa', textColor: 'dark' },
  { id: 'mint', name: 'Menta', hex: '#98ff98', textColor: 'dark' },
  { id: 'charcoal', name: 'Carbón', hex: '#36454f', textColor: 'light' },
  { id: 'cream', name: 'Crema', hex: '#fffdd0', textColor: 'dark' },
  { id: 'mustard', name: 'Mostaza', hex: '#ffdb58', textColor: 'dark' },
  { id: 'dusty-rose', name: 'Rosa Palo', hex: '#dcae96', textColor: 'dark' },
];

const DESIGN_SIZES = [
  { id: 'xs', name: 'XS', width: 8, description: '8cm - Logo pequeño' },
  { id: 'sm', name: 'S', width: 12, description: '12cm - Pecho izquierdo' },
  { id: 'md', name: 'M', width: 20, description: '20cm - Estándar' },
  { id: 'lg', name: 'L', width: 28, description: '28cm - Grande' },
  { id: 'xl', name: 'XL', width: 35, description: '35cm - Espalda completa' },
];

interface DesignState {
  imageUrl: string;
  placement: string;
  size: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipH: boolean;
}

interface CollectionColor {
  hex: string;
  name: string;
}

export default function DesignStudioPage() {
  // Design state
  const [designImage, setDesignImage] = useState<string>('');
  const [garmentType, setGarmentType] = useState('tshirt');
  const [garmentColor, setGarmentColor] = useState('white');
  const [placement, setPlacement] = useState('front-center');
  const [designSize, setDesignSize] = useState('md');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Collection state
  const [collectionName, setCollectionName] = useState('');
  const [collectionColors, setCollectionColors] = useState<CollectionColor[]>([
    { hex: '#1a1a1a', name: 'Negro' },
    { hex: '#FFFFFF', name: 'Blanco' },
    { hex: '#7c3aed', name: 'Púrpura' },
  ]);
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newColorName, setNewColorName] = useState('');

  // Variants
  const [variants, setVariants] = useState<{ garmentColor: string; designVariant: 'light' | 'dark' }[]>([]);
  const [showVariants, setShowVariants] = useState(false);

  // Saved designs
  const [savedDesigns, setSavedDesigns] = useState<DesignState[]>([]);

  // OpenRouter AI Generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Garment type filter state
  const [garmentCategory, setGarmentCategory] = useState<'all' | 'clothing' | 'accessories' | 'home'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter garments by category
  const GARMENT_CATEGORIES = {
    clothing: ['tshirt', 'hoodie', 'tanktop', 'longsleeve', 'sweatshirt', 'polo', 'jacket', 'pants', 'shorts'],
    accessories: ['cap', 'beanie', 'tote', 'backpack', 'phone-case'],
    home: ['mug', 'poster', 'sticker'],
  };

  const filteredGarmentTypes = garmentCategory === 'all'
    ? GARMENT_TYPES
    : GARMENT_TYPES.filter(g => GARMENT_CATEGORIES[garmentCategory]?.includes(g.id));

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studio-designs');
    if (saved) {
      setSavedDesigns(JSON.parse(saved));
    }
    const savedCollection = localStorage.getItem('studio-collection');
    if (savedCollection) {
      const data = JSON.parse(savedCollection);
      setCollectionName(data.name || '');
      setCollectionColors(data.colors || []);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDesignImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadFromGenerator = () => {
    // Get the last generated image from localStorage
    const history = localStorage.getItem('generated-images');
    if (history) {
      const images = JSON.parse(history);
      if (images.length > 0) {
        setDesignImage(images[0]);
      }
    }
  };

  // Generate design with OpenRouter AI
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      setGenerationError('Por favor escribe una descripción del diseño');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          model: 'google/gemini-2.0-flash-exp:free',
        }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setDesignImage(data.imageUrl);
        setShowGenerator(false);
        setAiPrompt('');

        // Save to history
        const history = localStorage.getItem('generated-images');
        const images = history ? JSON.parse(history) : [];
        images.unshift(data.imageUrl);
        localStorage.setItem('generated-images', JSON.stringify(images.slice(0, 20)));
      } else {
        setGenerationError(data.error || 'Error al generar el diseño');
      }
    } catch (error) {
      console.error('Error generating design:', error);
      setGenerationError('Error de conexión al generar el diseño');
    } finally {
      setIsGenerating(false);
    }
  };

  const addCollectionColor = () => {
    if (newColorHex && newColorName) {
      setCollectionColors([...collectionColors, { hex: newColorHex, name: newColorName }]);
      setNewColorHex('#000000');
      setNewColorName('');
    }
  };

  const removeCollectionColor = (index: number) => {
    setCollectionColors(collectionColors.filter((_, i) => i !== index));
  };

  const generateVariants = () => {
    // Generate variants for all garment colors
    const newVariants = GARMENT_COLORS.map((color) => ({
      garmentColor: color.id,
      designVariant: color.textColor as 'light' | 'dark',
    }));
    setVariants(newVariants);
    setShowVariants(true);
  };

  const saveDesign = () => {
    const design: DesignState = {
      imageUrl: designImage,
      placement,
      size: designSize,
      offsetX,
      offsetY,
      rotation,
      flipH,
    };
    const updated = [...savedDesigns, design];
    setSavedDesigns(updated);
    localStorage.setItem('studio-designs', JSON.stringify(updated));
  };

  const saveCollection = () => {
    localStorage.setItem('studio-collection', JSON.stringify({
      name: collectionName,
      colors: collectionColors,
    }));
    alert('Colección guardada');
  };

  const resetDesign = () => {
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    setFlipH(false);
    setDesignSize('md');
    setPlacement('front-center');
  };

  const currentGarment = GARMENT_TYPES.find((g) => g.id === garmentType);
  const currentGarmentColor = GARMENT_COLORS.find((c) => c.id === garmentColor);
  const currentPlacement = PLACEMENTS[placement as keyof typeof PLACEMENTS];
  const currentSize = DESIGN_SIZES.find((s) => s.id === designSize);

  // Calculate design position and size for preview
  const designStyle = {
    left: `${currentPlacement.x + offsetX}%`,
    top: `${currentPlacement.y + offsetY}%`,
    width: `${(currentSize?.width || 20) * 2}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
  };

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
            <div className="flex gap-2">
              <button
                onClick={resetDesign}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={saveDesign}
                disabled={!designImage}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-4">
            {/* Design Upload */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                Diseño
              </h3>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Subir</span>
                </button>
                <button
                  onClick={handleLoadFromGenerator}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs">Historial</span>
                </button>
                <button
                  onClick={() => setShowGenerator(!showGenerator)}
                  className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${
                    showGenerator
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span className="text-xs">IA</span>
                </button>
              </div>

              {/* AI Generator Panel */}
              {showGenerator && (
                <div className="mt-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2 text-sm">
                    <Wand2 className="w-4 h-4" />
                    Generar con OpenRouter AI
                  </h4>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe tu diseño... Ej: Un león geométrico minimalista en estilo line art"
                    className="w-full p-2 border border-green-300 rounded-lg text-sm resize-none h-20 focus:outline-none focus:border-green-500 bg-white text-gray-900"
                    disabled={isGenerating}
                  />
                  {generationError && (
                    <p className="text-red-500 text-xs mt-1">{generationError}</p>
                  )}
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full mt-2 p-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-sm hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generar Diseño
                      </>
                    )}
                  </button>
                  <p className="text-xs text-green-700 mt-2 text-center">
                    Powered by OpenRouter + Gemini
                  </p>
                </div>
              )}

              {designImage && (
                <div className="mt-3 relative">
                  <img
                    src={designImage}
                    alt="Design"
                    className="w-full h-32 object-contain bg-gray-100 rounded-lg"
                  />
                  <button
                    onClick={() => setDesignImage('')}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Garment Type */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-purple-600" />
                Tipo de Producto
              </h3>

              {/* Category Filter */}
              <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-lg">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'clothing', label: 'Ropa' },
                  { id: 'accessories', label: 'Accesorios' },
                  { id: 'home', label: 'Hogar' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setGarmentCategory(cat.id as typeof garmentCategory)}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      garmentCategory === cat.id
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredGarmentTypes.map((garment) => (
                  <button
                    key={garment.id}
                    onClick={() => {
                      setGarmentType(garment.id);
                      if (!garment.placements.includes(placement)) {
                        setPlacement(garment.placements[0]);
                      }
                    }}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      garmentType === garment.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <span>{garment.icon}</span>
                    <span className="truncate">{garment.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {filteredGarmentTypes.length} productos disponibles
              </p>
            </div>

            {/* Placement */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Move className="w-5 h-5 text-purple-600" />
                Ubicación
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {currentGarment?.placements.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlacement(p)}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      placement === p
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    {PLACEMENTS[p as keyof typeof PLACEMENTS].name}
                  </button>
                ))}
              </div>

              {/* Fine-tune position */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ajuste Horizontal</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ajuste Vertical</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-purple-600" />
                Tamaño del Diseño
              </h3>
              <div className="space-y-2">
                {DESIGN_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setDesignSize(size.id)}
                    className={`w-full p-2 rounded-lg text-left transition-colors ${
                      designSize === size.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <span className="font-bold">{size.name}</span>
                    <span className="text-xs ml-2 opacity-75">{size.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transformations */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Transformaciones</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rotación: {rotation}°</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() => setFlipH(!flipH)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg w-full ${
                    flipH ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  Voltear Horizontal
                </button>
              </div>
            </div>
          </div>

          {/* Center - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Vista Previa</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mockup Preview */}
              <div
                className="relative mx-auto rounded-lg overflow-hidden"
                style={{
                  width: `${zoom * 2.5}px`,
                  height: `${zoom * 3}px`,
                  backgroundColor: currentGarmentColor?.hex,
                  transition: 'background-color 0.3s',
                }}
              >
                {/* T-shirt shape overlay */}
                <svg
                  viewBox="0 0 100 120"
                  className="absolute inset-0 w-full h-full"
                  style={{ opacity: 0.1 }}
                >
                  {garmentType === 'tshirt' && (
                    <path
                      d="M20,20 L35,10 L40,20 L60,20 L65,10 L80,20 L85,35 L75,40 L75,110 L25,110 L25,40 L15,35 Z"
                      fill={currentGarmentColor?.textColor === 'light' ? '#fff' : '#000'}
                    />
                  )}
                </svg>

                {/* Design */}
                {designImage && (
                  <img
                    src={designImage}
                    alt="Design preview"
                    className="absolute object-contain pointer-events-none"
                    style={designStyle}
                  />
                )}

                {/* Placement guide */}
                {!designImage && (
                  <div
                    className="absolute border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center"
                    style={{
                      left: `${currentPlacement.x}%`,
                      top: `${currentPlacement.y}%`,
                      width: `${currentPlacement.maxWidth}%`,
                      height: '30%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="text-xs text-gray-500">{currentPlacement.name}</span>
                  </div>
                )}
              </div>

              {/* Garment Color Selector */}
              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-2">Color de Prenda</label>
                <div className="flex flex-wrap gap-2">
                  {GARMENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setGarmentColor(color.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        garmentColor === color.id
                          ? 'border-purple-600 scale-110'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Collection & Variants */}
          <div className="space-y-4">
            {/* Collection Palette */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Paleta de Colección
              </h3>

              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Nombre de la colección..."
                className="w-full p-2 border rounded-lg mb-3 text-sm text-gray-900 bg-white"
              />

              <div className="space-y-2 mb-3">
                {collectionColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="flex-1 text-sm text-gray-700">{color.name}</span>
                    <button
                      onClick={() => removeCollectionColor(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Nombre del color"
                  className="flex-1 p-2 border rounded-lg text-sm text-gray-900 bg-white"
                />
                <button
                  onClick={addCollectionColor}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={saveCollection}
                className="w-full mt-3 p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Guardar Paleta
              </button>
            </div>

            {/* Variant Generator */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Generador de Variantes
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Genera variantes del diseño para diferentes colores de prenda
              </p>
              <button
                onClick={generateVariants}
                disabled={!designImage}
                className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                Generar Todas las Variantes
              </button>

              {showVariants && variants.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {variants.map((variant, index) => {
                    const color = GARMENT_COLORS.find((c) => c.id === variant.garmentColor);
                    return (
                      <div
                        key={index}
                        className="aspect-square rounded-lg relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500"
                        style={{ backgroundColor: color?.hex }}
                        onClick={() => setGarmentColor(variant.garmentColor)}
                      >
                        {designImage && (
                          <img
                            src={designImage}
                            alt=""
                            className="absolute inset-2 object-contain"
                            style={{
                              filter: variant.designVariant === 'light' ? 'invert(0)' : 'invert(0)',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                Exportar
              </h3>
              <div className="space-y-2">
                <button
                  disabled={!designImage}
                  className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Mockup
                </button>
                <button
                  disabled={!designImage}
                  className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver en Gelato
                </button>
              </div>
            </div>

            {/* Saved Designs */}
            {savedDesigns.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                  Diseños Guardados ({savedDesigns.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {savedDesigns.slice(0, 6).map((design, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500"
                      onClick={() => {
                        setDesignImage(design.imageUrl);
                        setPlacement(design.placement);
                        setDesignSize(design.size);
                        setOffsetX(design.offsetX);
                        setOffsetY(design.offsetY);
                        setRotation(design.rotation);
                        setFlipH(design.flipH);
                      }}
                    >
                      <img
                        src={design.imageUrl}
                        alt={`Design ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
