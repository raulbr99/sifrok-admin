'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Check,
  Zap,
  DollarSign,
  Brain,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
    image?: number;
  };
  isFree: boolean;
  canGenerateImages: boolean;
  canGenerateText: boolean;
  modality: string;
}

export default function SettingsPage() {
  const [textModel, setTextModel] = useState('google/gemini-2.0-flash-exp:free');
  const [imageModel, setImageModel] = useState('google/gemini-2.0-flash-exp:free');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [textModels, setTextModels] = useState<Model[]>([]);
  const [imageModels, setImageModels] = useState<Model[]>([]);
  const [textSearch, setTextSearch] = useState('');
  const [imageSearch, setImageSearch] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Load settings from localStorage
  useEffect(() => {
    const savedTextModel = localStorage.getItem('openrouter-text-model');
    const savedImageModel = localStorage.getItem('openrouter-image-model');
    if (savedTextModel) setTextModel(savedTextModel);
    if (savedImageModel) setImageModel(savedImageModel);
  }, []);

  // Fetch models from API
  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/models');
      const data = await response.json();

      if (response.ok && data.success) {
        setTextModels(data.textModels);
        setImageModels(data.imageModels);
        setLastUpdated(data.lastUpdated);
      } else {
        setError(data.error || 'Error al cargar modelos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSave = () => {
    localStorage.setItem('openrouter-text-model', textModel);
    localStorage.setItem('openrouter-image-model', imageModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    if (price < 0.0001) return `$${(price * 1000000).toFixed(2)}/1M`;
    return `$${price.toFixed(4)}`;
  };

  const filterModels = (models: Model[], search: string) => {
    let filtered = models;

    if (showFreeOnly) {
      filtered = filtered.filter((m) => m.isFree);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.provider.toLowerCase().includes(searchLower) ||
          m.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const filteredTextModels = filterModels(textModels, textSearch);
  const filteredImageModels = filterModels(imageModels, imageSearch);

  const ModelCard = ({
    model,
    isSelected,
    onSelect,
    type,
  }: {
    model: Model;
    isSelected: boolean;
    onSelect: () => void;
    type: 'text' | 'image';
  }) => {
    const accentColor = type === 'text' ? 'purple' : 'pink';

    return (
      <label
        className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? `border-${accentColor}-500 bg-${accentColor}-50`
            : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          borderColor: isSelected ? (type === 'text' ? '#a855f7' : '#ec4899') : undefined,
          backgroundColor: isSelected ? (type === 'text' ? '#faf5ff' : '#fdf2f8') : undefined,
        }}
      >
        <input
          type="radio"
          name={`${type}Model`}
          value={model.id}
          checked={isSelected}
          onChange={onSelect}
          className="sr-only"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-gray-900 truncate">{model.name}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
              {model.provider}
            </span>
            {model.isFree && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded font-medium flex-shrink-0">
                Gratis
              </span>
            )}
          </div>
          {model.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{model.description}</p>
          )}
          <div className="flex gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Zap className="w-3 h-3" />
              {model.contextLength > 0 ? `${(model.contextLength / 1000).toFixed(0)}K ctx` : 'N/A'}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                model.isFree
                  ? 'text-green-600 bg-green-100'
                  : 'text-gray-600 bg-gray-100'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              {formatPrice(model.pricing.prompt)}
            </span>
          </div>
        </div>
        {isSelected && (
          <Check
            className="w-5 h-5 flex-shrink-0"
            style={{ color: type === 'text' ? '#a855f7' : '#ec4899' }}
          />
        )}
      </label>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando modelos de OpenRouter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-gray-700" />
                Configuración
              </h1>
              <p className="text-gray-600 mt-2">
                Selecciona los modelos de IA de OpenRouter
              </p>
            </div>
            <button
              onClick={fetchModels}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">
              Última actualización: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filter Options */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFreeOnly}
              onChange={(e) => setShowFreeOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mostrar solo modelos gratuitos
            </span>
          </label>
        </div>

        {/* Text Model Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Modelo de Texto
            <span className="text-sm font-normal text-gray-500">
              ({filteredTextModels.length} modelos)
            </span>
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Usado para generar ideas y mejorar prompts
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={textSearch}
              onChange={(e) => setTextSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
            />
            {textSearch && (
              <button
                onClick={() => setTextSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected model indicator */}
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Seleccionado:</strong> {textModel}
            </p>
          </div>

          <div className="grid gap-3 max-h-[400px] overflow-y-auto">
            {filteredTextModels.length > 0 ? (
              filteredTextModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={textModel === model.id}
                  onSelect={() => setTextModel(model.id)}
                  type="text"
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No se encontraron modelos de texto
              </p>
            )}
          </div>
        </div>

        {/* Image Model Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-600" />
            Modelo de Imagen
            <span className="text-sm font-normal text-gray-500">
              ({filteredImageModels.length} modelos)
            </span>
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Usado para generar diseños
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={imageSearch}
              onChange={(e) => setImageSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
            />
            {imageSearch && (
              <button
                onClick={() => setImageSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected model indicator */}
          <div className="mb-4 p-3 bg-pink-50 rounded-lg">
            <p className="text-sm text-pink-700">
              <strong>Seleccionado:</strong> {imageModel}
            </p>
          </div>

          <div className="grid gap-3 max-h-[400px] overflow-y-auto">
            {filteredImageModels.length > 0 ? (
              filteredImageModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={imageModel === model.id}
                  onSelect={() => setImageModel(model.id)}
                  type="image"
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No se encontraron modelos de imagen
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4 sticky bottom-4 bg-gray-50 py-4">
          <Link
            href="/"
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium bg-white rounded-lg shadow-sm"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Guardado
              </>
            ) : (
              'Guardar Configuración'
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">Sobre los modelos</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              <strong>Modelos gratuitos:</strong> Perfectos para experimentar sin costo
            </li>
            <li>
              <strong>Modelos de pago:</strong> Mayor calidad, requieren créditos en OpenRouter
            </li>
            <li>
              <strong>Contexto (ctx):</strong> Cantidad de tokens que puede procesar el modelo
            </li>
            <li>
              Los modelos se actualizan automáticamente desde OpenRouter
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
