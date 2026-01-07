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

interface BatchResult {
  index: number;
  prompt: string;
  imageUrl: string;
  success: boolean;
}

export default function BatchGeneratorPage() {
  const [customPrompts, setCustomPrompts] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const prompts = customPrompts.split('\n').filter(p => p.trim());
    if (prompts.length === 0) {
      alert('Por favor escribe al menos un prompt');
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
      alert('Error al descargar la imagen');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-600" />
            Generación Batch
          </h1>
          <p className="text-gray-600 mt-2">
            Genera múltiples diseños de una vez escribiendo un prompt por línea
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Prompts
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Escribe un prompt por línea. Cada línea generará una imagen.
            </p>

            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <textarea
                  value={customPrompts}
                  onChange={(e) => setCustomPrompts(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm text-gray-900 bg-white"
                  placeholder="minimalist cat design for t-shirt&#10;geometric wolf illustration&#10;abstract mountain art&#10;cyberpunk astronaut"
                  disabled={batchLoading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {customPrompts.split('\n').filter(p => p.trim()).length} prompts
                </p>
              </div>

              <button
                type="submit"
                disabled={batchLoading || !customPrompts.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {batchLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando... ({batchResults.length}/{customPrompts.split('\n').filter(p => p.trim()).length})
                  </>
                ) : (
                  <>
                    <Layers className="w-5 h-5" />
                    Generar Todos
                  </>
                )}
              </button>
            </form>

            {/* Tips */}
            <div className="mt-6 bg-purple-50 rounded-lg p-4">
              <p className="font-medium text-gray-800 mb-2">Consejos:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Usa prompts en inglés para mejores resultados</li>
                <li>• Incluye "for t-shirt" o "for merchandise"</li>
                <li>• Los diseños minimalistas funcionan mejor</li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Resultados</h2>
              {batchResults.filter(r => r.success).length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar Todos
                </button>
              )}
            </div>

            {batchResults.length === 0 && !batchLoading && (
              <div className="text-center py-12 text-gray-400">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Los diseños generados aparecerán aquí</p>
              </div>
            )}

            {batchLoading && batchResults.length === 0 && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
                <p className="text-gray-600">Iniciando generación...</p>
              </div>
            )}

            {batchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">
                    {batchResults.filter(r => r.success).length} de {batchResults.length} diseños completados
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {batchResults.map((result) => (
                    <div
                      key={result.index}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 ${
                        result.success ? 'border-green-500' : 'border-red-500'
                      }`}
                    >
                      {result.imageUrl ? (
                        <>
                          <img
                            src={result.imageUrl}
                            alt={`Diseño ${result.index}`}
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => handleDownloadImage(result.imageUrl, result.index)}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {batchLoading && result.index === batchResults.length ? (
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          ) : (
                            <XCircle className="w-8 h-8 text-red-500" />
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

            {/* Link to Gelato */}
            {batchResults.filter(r => r.success).length > 0 && (
              <div className="mt-6 text-center border-t pt-4">
                <a
                  href="https://dashboard.gelato.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Subir diseños a Gelato Dashboard
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
