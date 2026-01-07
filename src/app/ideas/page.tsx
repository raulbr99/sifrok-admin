'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  Loader2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

interface Idea {
  title: string;
  prompt: string;
  tags: string[];
}

const THEMES = [
  'Animales',
  'Naturaleza',
  'Espacio',
  'Retro/Vintage',
  'Minimalista',
  'Abstracto',
  'Gaming',
  'Música',
  'Deportes',
  'Comida',
  'Viajes',
  'Tecnología',
  'Arte Pop',
  'Japonés/Anime',
  'Horror',
  'Motivacional',
];

const STYLES = [
  { id: '', name: 'Cualquier estilo' },
  { id: 'minimalist', name: 'Minimalista' },
  { id: 'geometric', name: 'Geométrico' },
  { id: 'vintage retro', name: 'Vintage/Retro' },
  { id: 'watercolor', name: 'Acuarela' },
  { id: 'line art', name: 'Line Art' },
  { id: 'cartoon', name: 'Cartoon' },
  { id: 'realistic', name: 'Realista' },
  { id: 'psychedelic', name: 'Psicodélico' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'kawaii cute', name: 'Kawaii' },
  { id: 'graffiti street art', name: 'Graffiti' },
];

export default function IdeasPage() {
  const [theme, setTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [style, setStyle] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [model, setModel] = useState('google/gemini-2.0-flash-exp:free');

  // Load model from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('openrouter-text-model');
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  const handleGenerate = async () => {
    const selectedTheme = customTheme.trim() || theme;
    if (!selectedTheme) {
      alert('Por favor selecciona o escribe un tema');
      return;
    }

    setLoading(true);
    setIdeas([]);

    try {
      const response = await fetch('/api/admin/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          style,
          count,
          model,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ideas) {
        setIdeas(data.ideas);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      alert('Error generando ideas');
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const usePrompt = (prompt: string) => {
    // Save to localStorage and redirect to generator
    localStorage.setItem('pending-prompt', prompt);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            Generador de Ideas
          </h1>
          <p className="text-gray-600 mt-2">
            Genera ideas creativas para diseños usando IA
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Configuración
              </h2>

              <div className="space-y-4">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      setCustomTheme('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Selecciona un tema</option>
                    {THEMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O escribe tu propio tema
                  </label>
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => {
                      setCustomTheme(e.target.value);
                      setTheme('');
                    }}
                    placeholder="Ej: Gatos astronautas, Flores mecánicas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de ideas
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    {[3, 5, 8, 10].map((n) => (
                      <option key={n} value={n}>{n} ideas</option>
                    ))}
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || (!theme && !customTheme.trim())}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5" />
                      Generar Ideas
                    </>
                  )}
                </button>

                {/* Settings Link */}
                <Link
                  href="/settings"
                  className="block text-center text-sm text-purple-600 hover:text-purple-800"
                >
                  Configurar modelo de IA
                </Link>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {ideas.length === 0 && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Las ideas generadas aparecerán aquí</p>
                <p className="text-gray-400 text-sm mt-2">
                  Selecciona un tema y haz clic en "Generar Ideas"
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-12 text-center">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-yellow-500 animate-spin" />
                <p className="text-gray-600">Generando ideas creativas...</p>
                <p className="text-gray-400 text-sm mt-2">Esto puede tardar unos segundos</p>
              </div>
            )}

            {ideas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    {ideas.length} ideas generadas
                  </h3>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerar
                  </button>
                </div>

                {ideas.map((idea, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {idea.title}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPrompt(idea.prompt, index)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Copiar prompt"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => usePrompt(idea.prompt)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                          title="Usar en generador"
                        >
                          <Wand2 className="w-3 h-3" />
                          Usar
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-3 bg-gray-50 p-3 rounded-lg font-mono">
                      {idea.prompt}
                    </p>

                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
