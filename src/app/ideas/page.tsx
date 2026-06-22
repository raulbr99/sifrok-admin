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
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/Field';

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
  const { toast } = useToast();
  const router = useRouter();
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
      toast.info('Elige un tema o escribe el tuyo para generar ideas.');
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
        toast.error(data.error || 'No se pudieron generar las ideas. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error('No se pudieron generar las ideas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const applyPrompt = (prompt: string) => {
    // Save to localStorage and navigate to the generator (client-side).
    localStorage.setItem('pending-prompt', prompt);
    router.push('/');
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-ink-muted hover:text-ink underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <h1 className="text-3xl font-black text-ink flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-ink" aria-hidden="true" />
            Generador de Ideas
          </h1>
          <p className="text-ink-muted mt-2">
            Genera ideas creativas para diseños usando IA
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-ink" aria-hidden="true" />
                Configuración
              </h2>

              <div className="space-y-4">
                {/* Theme Selection */}
                <div>
                  <label htmlFor="idea-theme" className="block text-sm font-medium text-ink mb-2">
                    Tema
                  </label>
                  <select
                    id="idea-theme"
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      setCustomTheme('');
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecciona un tema</option>
                    {THEMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Theme */}
                <div>
                  <label htmlFor="idea-custom-theme" className="block text-sm font-medium text-ink mb-2">
                    O escribe tu propio tema
                  </label>
                  <input
                    id="idea-custom-theme"
                    type="text"
                    value={customTheme}
                    onChange={(e) => {
                      setCustomTheme(e.target.value);
                      setTheme('');
                    }}
                    placeholder="Ej: Gatos astronautas, Flores mecánicas..."
                    className={inputClass}
                  />
                </div>

                {/* Style */}
                <div>
                  <label htmlFor="idea-style" className="block text-sm font-medium text-ink mb-2">
                    Estilo
                  </label>
                  <select
                    id="idea-style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className={inputClass}
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Count */}
                <div>
                  <label htmlFor="idea-count" className="block text-sm font-medium text-ink mb-2">
                    Cantidad de ideas
                  </label>
                  <select
                    id="idea-count"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className={inputClass}
                  >
                    {[3, 5, 8, 10].map((n) => (
                      <option key={n} value={n}>{n} ideas</option>
                    ))}
                  </select>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!theme && !customTheme.trim()}
                  loading={loading}
                  className="w-full"
                >
                  {loading ? (
                    'Generando...'
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5" aria-hidden="true" />
                      Generar Ideas
                    </>
                  )}
                </Button>

                {/* Settings Link */}
                <Link
                  href="/settings"
                  className="block text-center text-sm text-ink-muted hover:text-ink"
                >
                  Configurar modelo de IA
                </Link>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2" aria-live="polite">
            {ideas.length === 0 && !loading && (
              <Card className="p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-ink-subtle" aria-hidden="true" />
                <p className="text-ink-muted">Las ideas generadas aparecerán aquí</p>
                <p className="text-ink-subtle text-sm mt-2">
                  Selecciona un tema y haz clic en "Generar Ideas"
                </p>
              </Card>
            )}

            {loading && (
              <Card className="p-12 text-center" role="status" aria-live="polite">
                <span className="sr-only">Cargando…</span>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-ink animate-spin" aria-hidden="true" />
                <p className="text-ink-muted">Generando ideas creativas...</p>
                <p className="text-ink-subtle text-sm mt-2">Esto puede tardar unos segundos</p>
              </Card>
            )}

            {ideas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-ink">
                    {ideas.length} ideas generadas
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Regenerar
                  </Button>
                </div>

                {ideas.map((idea, index) => (
                  <Card
                    key={index}
                    className="p-6 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-bold text-ink flex items-center gap-2">
                        <span className="w-6 h-6 bg-accent text-accent-ink rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {idea.title}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPrompt(idea.prompt, index)}
                          className="p-2 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-btn transition-colors"
                          title="Copiar prompt"
                          aria-label={copiedIndex === index ? 'Prompt copiado' : 'Copiar prompt'}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-success" aria-hidden="true" />
                          ) : (
                            <Copy className="w-4 h-4" aria-hidden="true" />
                          )}
                        </button>
                        <Button
                          size="sm"
                          onClick={() => applyPrompt(idea.prompt)}
                          title="Usar en generador"
                        >
                          <Wand2 className="w-3 h-3" aria-hidden="true" />
                          Usar
                        </Button>
                      </div>
                    </div>

                    <p className="text-ink-muted text-sm mb-3 bg-surface-2 p-3 rounded-btn font-mono">
                      {idea.prompt}
                    </p>

                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} tone="neutral">
                            <Tag className="w-3 h-3" aria-hidden="true" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
