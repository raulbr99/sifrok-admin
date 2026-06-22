'use client';

import { useState } from 'react';
import {
  Layers,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Download,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { inputClass } from '@/components/ui/Field';

interface BatchResult {
  index: number;
  prompt: string;
  imageUrl: string;
  success: boolean;
}

export default function BatchGeneratorPage() {
  const { toast } = useToast();
  const [customPrompts, setCustomPrompts] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const prompts = customPrompts.split('\n').filter(p => p.trim());
    if (prompts.length === 0) {
      toast.info('Escribe al menos un prompt, uno por línea.');
      return;
    }

    setBatchLoading(true);
    setBatchResults([]);

    const results: BatchResult[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i].trim();
      try {
        const response = await fetch('/api/admin/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        results.push({
          index: i + 1,
          prompt,
          imageUrl: data.imageUrl || '',
          success: response.ok && !!data.imageUrl,
        });
      } catch {
        results.push({
          index: i + 1,
          prompt,
          imageUrl: '',
          success: false,
        });
      }

      setBatchResults([...results]);
    }

    setBatchLoading(false);
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sifrok-batch-${index}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando imagen:', error);
      toast.error('No se pudo descargar la imagen. Inténtalo de nuevo.');
    }
  };

  const handleDownloadAll = async () => {
    const successResults = batchResults.filter(r => r.success && r.imageUrl);
    for (const result of successResults) {
      await handleDownloadImage(result.imageUrl, result.index);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
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
            <Layers className="w-8 h-8 text-ink" aria-hidden="true" />
            Generación Batch
          </h1>
          <p className="text-ink-muted mt-2">
            Genera múltiples diseños de una vez escribiendo un prompt por línea
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ink" aria-hidden="true" />
              Prompts
            </h2>
            <p className="text-ink-muted text-sm mb-6">
              Escribe un prompt por línea. Cada línea generará una imagen.
            </p>

            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <label htmlFor="batch-prompts" className="sr-only">
                  Prompts, uno por línea
                </label>
                <textarea
                  id="batch-prompts"
                  value={customPrompts}
                  onChange={(e) => setCustomPrompts(e.target.value)}
                  rows={10}
                  className={`${inputClass} resize-none font-mono`}
                  placeholder="minimalist cat design for t-shirt&#10;geometric wolf illustration&#10;abstract mountain art&#10;cyberpunk astronaut"
                  disabled={batchLoading}
                />
                <p className="text-xs text-ink-subtle mt-2" aria-live="polite">
                  {customPrompts.split('\n').filter(p => p.trim()).length} prompts
                </p>
              </div>

              <Button
                type="submit"
                disabled={!customPrompts.trim()}
                loading={batchLoading}
                className="w-full py-4 text-lg"
              >
                {batchLoading ? (
                  `Generando... (${batchResults.length}/${customPrompts.split('\n').filter(p => p.trim()).length})`
                ) : (
                  <>
                    <Layers className="w-5 h-5" aria-hidden="true" />
                    Generar Todos
                  </>
                )}
              </Button>
            </form>

            {/* Tips */}
            <div className="mt-6 bg-info-bg rounded-card p-4">
              <p className="font-medium text-ink mb-2">Consejos:</p>
              <ul className="text-sm text-ink-muted space-y-1">
                <li>• Usa prompts en inglés para mejores resultados</li>
                <li>• Incluye "for t-shirt" o "for merchandise"</li>
                <li>• Los diseños minimalistas funcionan mejor</li>
              </ul>
            </div>
          </Card>

          {/* Results */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ink">Resultados</h2>
              {batchResults.filter(r => r.success).length > 0 && (
                <Button size="sm" onClick={handleDownloadAll}>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Descargar Todos
                </Button>
              )}
            </div>

            <div aria-live="polite">
            {batchResults.length === 0 && !batchLoading && (
              <div className="text-center py-12 text-ink-muted">
                <Layers className="w-16 h-16 mx-auto mb-4 text-ink-subtle" aria-hidden="true" />
                <p>Los diseños generados aparecerán aquí</p>
              </div>
            )}

            {batchLoading && batchResults.length === 0 && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-ink animate-spin" aria-hidden="true" />
                <p className="text-ink-muted">Iniciando generación...</p>
              </div>
            )}

            {batchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success mb-4">
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  <span className="font-bold">
                    {batchResults.filter(r => r.success).length} de {batchResults.length} diseños completados
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {batchResults.map((result) => (
                    <div
                      key={result.index}
                      className={`relative aspect-square rounded-card overflow-hidden border-2 bg-surface-2 ${
                        result.success ? 'border-success' : 'border-danger'
                      }`}
                    >
                      {result.imageUrl ? (
                        <>
                          <img
                            src={result.imageUrl}
                            alt={`Diseño generado ${result.index}: ${result.prompt}`}
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => handleDownloadImage(result.imageUrl, result.index)}
                            aria-label={`Descargar diseño ${result.index}`}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-btn transition-colors"
                          >
                            <Download className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {batchLoading && result.index === batchResults.length ? (
                            <Loader2 className="w-8 h-8 text-ink animate-spin" aria-hidden="true" />
                          ) : (
                            <XCircle className="w-8 h-8 text-danger" aria-hidden="true" />
                          )}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                        #{result.index}: {result.prompt.substring(0, 30)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* Link to Printful */}
            {batchResults.filter(r => r.success).length > 0 && (
              <div className="mt-6 text-center border-t border-border pt-4">
                <a
                  href="https://www.printful.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ink-muted hover:text-ink font-medium"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Subir diseños a Printful Dashboard
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
