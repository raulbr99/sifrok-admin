'use client';

import { useState, useEffect } from 'react';
import {
  Wand2,
  Layers,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Package,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  Euro,
  Ruler,
  Palette,
} from 'lucide-react';
import Link from 'next/link';

interface Theme {
  id: string;
  name: string;
  designCount: number;
  previews: string[];
}

interface ProductType {
  id: string;
  name: string;
}

interface BatchResult {
  index: number;
  prompt: string;
  imageUrl: string;
  success: boolean;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const AVAILABLE_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#FFFFFF' },
  { id: 'black', name: 'Negro', hex: '#000000' },
  { id: 'navy', name: 'Azul Marino', hex: '#1e3a5f' },
  { id: 'red', name: 'Rojo', hex: '#dc2626' },
  { id: 'gray', name: 'Gris', hex: '#6b7280' },
  { id: 'green', name: 'Verde', hex: '#16a34a' },
];

export default function AutomatizacionesPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'batch'>('pipeline');

  // Pipeline state
  const [pipelinePrompt, setPipelinePrompt] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [pipelineProducts, setPipelineProducts] = useState<string[]>(['tshirt']);
  const [pipelinePrice, setPipelinePrice] = useState('24.99');
  const [pipelineSizes, setPipelineSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [pipelineColors, setPipelineColors] = useState<string[]>(['white', 'black']);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  // Batch state
  const [themes, setThemes] = useState<Theme[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customPrompts, setCustomPrompts] = useState('');
  const [batchCount, setBatchCount] = useState(4);
  const [batchProductType, setBatchProductType] = useState('tshirt');
  const [batchPrice, setBatchPrice] = useState('24.99');
  const [batchSizes, setBatchSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [collectionName, setCollectionName] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  useEffect(() => {
    fetch('/api/admin/batch-generate')
      .then(res => res.json())
      .then(data => {
        setThemes(data.themes || []);
        setProductTypes(data.productTypes || []);
      })
      .catch(console.error);
  }, []);

  const handlePipelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPipelineLoading(true);
    setPipelineResult(null);

    try {
      const response = await fetch('/api/admin/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: pipelinePrompt,
          name: pipelineName,
          description: pipelineDescription,
          productTypes: pipelineProducts,
          price: parseFloat(pipelinePrice),
          sizes: pipelineSizes,
          colors: pipelineColors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el pipeline');
      }

      setPipelineResult(data);
    } catch (error: any) {
      setPipelineResult({ error: error.message });
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchLoading(true);
    setBatchResults([]);

    try {
      const prompts = customPrompts
        ? customPrompts.split('\n').filter(p => p.trim())
        : undefined;

      const response = await fetch('/api/admin/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme || undefined,
          customPrompts: prompts,
          count: batchCount,
          productType: batchProductType,
          price: parseFloat(batchPrice),
          sizes: batchSizes,
          collectionName: collectionName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la generación batch');
      }

      setBatchResults(data.results || []);
    } catch (error: any) {
      setBatchResults([{ index: 0, prompt: '', imageUrl: '', success: false }]);
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleProductType = (type: string) => {
    setPipelineProducts(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSize = (size: string, isBatch = false) => {
    if (isBatch) {
      setBatchSizes(prev =>
        prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
      );
    } else {
      setPipelineSizes(prev =>
        prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
      );
    }
  };

  const toggleColor = (color: string) => {
    setPipelineColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-purple-600 hover:underline text-sm mb-2 inline-block">
            ← Volver al Admin
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Automatizaciones de Diseño
          </h1>
          <p className="text-gray-600 mt-2">
            Genera diseños con IA y publícalos automáticamente en tu tienda
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pipeline'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            <Wand2 className="w-5 h-5" />
            Pipeline Único
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === 'batch'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            <Layers className="w-5 h-5" />
            Generación Batch
          </button>
        </div>

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                Pipeline Automático
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Genera un diseño → Sube a hosting → Crea productos en Gelato. Todo en un clic.
              </p>

              <form onSubmit={handlePipelineSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt del Diseño *
                  </label>
                  <textarea
                    value={pipelinePrompt}
                    onChange={(e) => setPipelinePrompt(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Ej: minimalist wolf howling at moon, geometric style, for t-shirt print"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      value={pipelineName}
                      onChange={(e) => setPipelineName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Lobo Geométrico"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Euro className="w-4 h-4 inline mr-1" />
                      Precio (EUR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={pipelinePrice}
                      onChange={(e) => setPipelinePrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={pipelineDescription}
                    onChange={(e) => setPipelineDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Descripción del producto..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Producto
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'tshirt', name: 'Camiseta' },
                      { id: 'hoodie', name: 'Sudadera' },
                      { id: 'mug', name: 'Taza' },
                      { id: 'poster', name: 'Poster' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleProductType(type.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          pipelineProducts.includes(type.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler className="w-4 h-4 inline mr-1" />
                    Tallas Disponibles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                          pipelineSizes.includes(size)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Colores Disponibles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => toggleColor(color.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                          pipelineColors.includes(color.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pipelineLoading || !pipelinePrompt}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pipelineLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando Pipeline...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Ejecutar Pipeline
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Pipeline Result */}
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resultado</h2>

              {!pipelineResult && !pipelineLoading && (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>El resultado aparecerá aquí</p>
                </div>
              )}

              {pipelineLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
                  <p className="text-gray-600">Generando diseño y creando productos...</p>
                  <p className="text-sm text-gray-400 mt-2">Esto puede tardar 30-60 segundos</p>
                </div>
              )}

              {pipelineResult && !pipelineResult.error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">{pipelineResult.message}</span>
                  </div>

                  {pipelineResult.imageUrl && (
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pipelineResult.imageUrl}
                        alt="Diseño generado"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">URL de la imagen:</p>
                    <code className="text-xs bg-gray-200 p-2 rounded block break-all">
                      {pipelineResult.imageUrl}
                    </code>
                  </div>

                  {pipelineResult.products && pipelineResult.products.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Productos creados:</p>
                      {pipelineResult.products.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                          <Package className="w-4 h-4 text-green-600" />
                          <span>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {pipelineResult?.error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <XCircle className="w-5 h-5" />
                  <span>{pipelineResult.error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch Tab */}
        {activeTab === 'batch' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Generación Batch
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Genera múltiples diseños de una temática automáticamente.
              </p>

              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temática
                  </label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">-- Selecciona una temática --</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name} ({theme.designCount} diseños)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O escribe prompts personalizados (uno por línea)
                  </label>
                  <textarea
                    value={customPrompts}
                    onChange={(e) => setCustomPrompts(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="minimalist cat design&#10;geometric dog illustration&#10;abstract bird art"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <select
                      value={batchCount}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {[2, 4, 6, 8].map((n) => (
                        <option key={n} value={n}>{n} diseños</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      value={batchProductType}
                      onChange={(e) => setBatchProductType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {productTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Euro className="w-4 h-4 inline mr-1" />
                      Precio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={batchPrice}
                      onChange={(e) => setBatchPrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler className="w-4 h-4 inline mr-1" />
                    Tallas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size, true)}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                          batchSizes.includes(size)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Colección
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Colección Verano 2025"
                  />
                </div>

                <button
                  type="submit"
                  disabled={batchLoading || (!selectedTheme && !customPrompts)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {batchLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generando {batchCount} diseños...
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5" />
                      Generar Colección
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Batch Results */}
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resultados</h2>

              {batchResults.length === 0 && !batchLoading && (
                <div className="text-center py-12 text-gray-400">
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Los diseños generados aparecerán aquí</p>
                </div>
              )}

              {batchLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
                  <p className="text-gray-600">Generando colección...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Esto puede tardar varios minutos
                  </p>
                </div>
              )}

              {batchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">
                      {batchResults.filter(r => r.success).length} diseños creados
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {batchResults.map((result, i) => (
                      <div
                        key={i}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 ${
                          result.success ? 'border-green-500' : 'border-red-500'
                        }`}
                      >
                        {result.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.imageUrl}
                            alt={`Diseño ${result.index}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                          #{result.index}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-purple-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-2">Consejos para mejores resultados</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>Usa prompts en inglés para mejores resultados con la IA</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>Incluye &quot;for t-shirt print&quot; o &quot;for merchandise&quot; en tus prompts</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>Los diseños minimalistas funcionan mejor en ropa</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>La generación batch puede tardar varios minutos, sé paciente</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
