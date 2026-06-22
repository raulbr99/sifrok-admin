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
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/Field';

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

  // Static class maps so Tailwind never purges these (no dynamic template-literal class names)
  const SELECTED_CARD_CLASSES: Record<'text' | 'image', string> = {
    text: 'border-accent bg-surface-2',
    image: 'border-accent bg-surface-2',
  };

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
    return (
      <label
        className={`relative flex items-start p-4 rounded-card border-2 cursor-pointer transition-colors ${
          isSelected
            ? SELECTED_CARD_CLASSES[type]
            : 'border-border bg-surface hover:border-border-strong'
        }`}
      >
        <input
          type="radio"
          name={`${type}Model`}
          value={model.id}
          checked={isSelected}
          onChange={onSelect}
          aria-label={`Seleccionar modelo ${model.name}`}
          className="sr-only"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-ink truncate">{model.name}</span>
            <Badge tone="neutral">{model.provider}</Badge>
            {model.isFree && <Badge tone="success">Gratis</Badge>}
          </div>
          {model.description && (
            <p className="text-xs text-ink-muted mb-2 line-clamp-2">{model.description}</p>
          )}
          <div className="flex gap-3 flex-wrap items-center">
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Zap className="w-3 h-3" aria-hidden="true" />
              {model.contextLength > 0 ? `${(model.contextLength / 1000).toFixed(0)}K ctx` : 'N/A'}
            </span>
            <Badge tone={model.isFree ? 'success' : 'neutral'}>
              <DollarSign className="w-3 h-3" aria-hidden="true" />
              {formatPrice(model.pricing.prompt)}
            </Badge>
          </div>
        </div>
        {isSelected && (
          <Check
            className="w-5 h-5 flex-shrink-0 text-ink"
            aria-hidden="true"
          />
        )}
      </label>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="w-12 h-12 animate-spin text-ink mx-auto mb-4" aria-hidden="true" />
          <p className="text-ink-muted">Cargando modelos de OpenRouter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-ink-muted hover:text-ink underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-ink flex items-center gap-3">
                <Settings className="w-8 h-8 text-ink" aria-hidden="true" />
                Configuración
              </h1>
              <p className="text-ink-muted mt-2">
                Selecciona los modelos de IA de OpenRouter
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={fetchModels}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Actualizar
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-ink-muted mt-2">
              Última actualización: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="bg-danger-bg border border-border text-danger px-4 py-3 rounded-card mb-6"
          >
            {error}
          </div>
        )}

        {/* Filter Options */}
        <Card className="p-4 mb-6">
          <label htmlFor="show-free-only" className="flex items-center gap-2 cursor-pointer">
            <input
              id="show-free-only"
              type="checkbox"
              checked={showFreeOnly}
              onChange={(e) => setShowFreeOnly(e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            <span className="text-sm font-medium text-ink">
              Mostrar solo modelos gratuitos
            </span>
          </label>
        </Card>

        {/* Text Model Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-ink mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-ink" aria-hidden="true" />
            Modelo de Texto
            <span className="text-sm font-normal text-ink-muted">
              ({filteredTextModels.length} modelos)
            </span>
          </h2>
          <p className="text-ink-muted text-sm mb-4">
            Usado para generar ideas y mejorar prompts
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <label htmlFor="text-model-search" className="sr-only">
              Buscar modelo de texto
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" />
            <input
              id="text-model-search"
              type="text"
              value={textSearch}
              onChange={(e) => setTextSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className={`${inputClass} pl-10 pr-10`}
            />
            {textSearch && (
              <button
                onClick={() => setTextSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Selected model indicator */}
          <div className="mb-4 p-3 bg-surface-2 rounded-card">
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Seleccionado:</strong> {textModel}
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
              <p className="text-ink-muted text-center py-8">
                No se encontraron modelos de texto
              </p>
            )}
          </div>
        </Card>

        {/* Image Model Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-ink mb-2 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-ink" aria-hidden="true" />
            Modelo de Imagen
            <span className="text-sm font-normal text-ink-muted">
              ({filteredImageModels.length} modelos)
            </span>
          </h2>
          <p className="text-ink-muted text-sm mb-4">
            Usado para generar diseños
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <label htmlFor="image-model-search" className="sr-only">
              Buscar modelo de imagen
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" />
            <input
              id="image-model-search"
              type="text"
              value={imageSearch}
              onChange={(e) => setImageSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className={`${inputClass} pl-10 pr-10`}
            />
            {imageSearch && (
              <button
                onClick={() => setImageSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Selected model indicator */}
          <div className="mb-4 p-3 bg-surface-2 rounded-card">
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Seleccionado:</strong> {imageModel}
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
              <p className="text-ink-muted text-center py-8">
                No se encontraron modelos de imagen
              </p>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4 sticky bottom-4 bg-bg py-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-ink border border-border-strong bg-surface rounded-btn font-medium hover:bg-surface-2 transition-colors"
          >
            Cancelar
          </Link>
          <Button onClick={handleSave}>
            {saved ? (
              <>
                <Check className="w-5 h-5" aria-hidden="true" />
                Guardado
              </>
            ) : (
              'Guardar Configuración'
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-info-bg rounded-card p-6">
          <h3 className="font-bold text-ink mb-2">Sobre los modelos</h3>
          <ul className="text-sm text-ink-muted space-y-2">
            <li>
              <strong className="text-ink">Modelos gratuitos:</strong> Perfectos para experimentar sin costo
            </li>
            <li>
              <strong className="text-ink">Modelos de pago:</strong> Mayor calidad, requieren créditos en OpenRouter
            </li>
            <li>
              <strong className="text-ink">Contexto (ctx):</strong> Cantidad de tokens que puede procesar el modelo
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
