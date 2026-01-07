'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Upload, Image as ImageIcon, Package, FileText, Download } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceInstructions, setEnhanceInstructions] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    // TODO: Verificar que el usuario sea admin
    // if (session?.user?.role !== 'admin') {
    //   router.push('/');
    // }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchUploadedFiles();
    }
  }, [session]);

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('/api/admin/files');
      const data = await response.json();
      setUploadedFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!aiPrompt.trim()) {
      alert('Por favor escribe una descripción primero');
      return;
    }

    setEnhancing(true);
    try {
      const response = await fetch('/api/admin/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          instructions: enhanceInstructions
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiPrompt(data.enhancedPrompt);
        setEnhanceInstructions('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      alert('Error mejorando el prompt');
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Por favor escribe una descripción para generar la imagen');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          image: generatedImage || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedImage(data.imageUrl);
        setPreviewUrl(data.imageUrl);
        alert('¡Imagen generada con IA exitosamente!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generando imagen con IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !generatedImage) {
      alert('Por favor escribe qué quieres cambiar de la imagen');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: editPrompt,
          image: generatedImage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedImage(data.imageUrl);
        setPreviewUrl(data.imageUrl);
        setEditPrompt('');
        alert('¡Imagen editada exitosamente!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert('Error editando imagen con IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImage) return;

    try {
      // Obtener la imagen
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nano-banana-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando imagen:', error);
      alert('Error al descargar la imagen');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile && !generatedImage) return;

    setUploading(true);
    try {
      let uploadResponse;

      if (generatedImage) {
        // Subir imagen generada por IA
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `ai-design-${Date.now()}.png`, { type: 'image/png' });

        const formData = new FormData();
        formData.append('file', file);

        uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Subir archivo seleccionado
        const formData = new FormData();
        formData.append('file', selectedFile!);

        uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
      }

      const data = await uploadResponse.json();

      if (uploadResponse.ok) {
        alert('¡Diseño subido exitosamente a Printful!');
        setSelectedFile(null);
        setPreviewUrl('');
        setGeneratedImage('');
        setAiPrompt('');
        fetchUploadedFiles();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error subiendo el archivo');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-5xl font-black text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Panel de Administración 🎨
        </h1>

        <div className="grid grid-cols-1 gap-8">
          {/* Generar con IA */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-8 border-4 border-purple-300">
            <h2 className="text-3xl font-black mb-6 text-purple-600 flex items-center gap-2">
              🍌 Generar Diseño con Nano Banana Pro
            </h2>

            <div className="mb-4">
              <label className="block mb-2 text-gray-700 font-bold">
                Describe tu diseño
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej: Un gato espacial con colores neón"
                className="w-full p-4 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 min-h-[100px]"
                disabled={generating || enhancing}
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700 font-bold text-sm">
                ¿Qué mejorar? (opcional)
              </label>
              <input
                type="text"
                value={enhanceInstructions}
                onChange={(e) => setEnhanceInstructions(e.target.value)}
                placeholder="Ej: hazlo más minimalista, añade más colores vibrantes, estilo retro..."
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                disabled={generating || enhancing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleEnhancePrompt}
                disabled={enhancing || generating || !aiPrompt.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-full font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enhancing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Mejorando...
                  </span>
                ) : (
                  '🚀 Mejorar Prompt'
                )}
              </button>

              <button
                onClick={handleGenerateAI}
                disabled={generating || enhancing || !aiPrompt.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-full font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Generando...
                  </span>
                ) : (
                  '✨ Generar Imagen'
                )}
              </button>
            </div>

            {generatedImage && (
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-300 rounded-xl p-6">
                <h3 className="text-xl font-black mb-4 text-green-700">
                  ✏️ Editar Imagen Generada
                </h3>
                <label className="block mb-2 text-gray-700 font-bold text-sm">
                  ¿Qué quieres cambiar?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Ej: añade más colores, cambia el fondo, hazlo más oscuro..."
                    className="flex-1 p-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500"
                    disabled={generating}
                  />
                  <button
                    onClick={handleEditImage}
                    disabled={generating || !editPrompt.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {generating ? '...' : '🔄 Editar'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 La IA tomará tu imagen actual y aplicará los cambios que describas
                </p>
              </div>
            )}

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>🍌 Nano Banana Pro:</strong> El modelo de Google Gemini que genera imágenes 2K increíbles. Escribe una idea simple y usa "Mejorar Prompt" para hacerlo más detallado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Subir Diseño */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-4 border-purple-200">
              <h2 className="text-3xl font-black mb-6 text-purple-600 flex items-center gap-2">
                <Upload className="w-8 h-8" />
                Subir Diseño
              </h2>

              <div className="mb-6">
                <label className="block mb-2 text-gray-700 font-bold">
                  Selecciona tu diseño (PNG, SVG, AI, PDF)
                </label>
                <input
                  type="file"
                  accept=".png,.svg,.ai,.pdf,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100
                    cursor-pointer"
                  disabled={generatedImage !== ''}
                />
              </div>

              {previewUrl && (
                <div className="mb-6">
                  <p className="text-gray-700 font-bold mb-2">Vista previa:</p>
                  <div className="border-4 border-purple-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                  {generatedImage ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-green-600 font-bold">
                        ✨ Generado con IA
                      </p>
                      <button
                        onClick={handleDownloadImage}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar Imagen
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Archivo: {selectedFile?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tamaño: {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={(!selectedFile && !generatedImage) || uploading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-full font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Subiendo a Printful...
                  </span>
                ) : (
                  'Subir a Printful'
                )}
              </button>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Los diseños deben ser de alta calidad (300 DPI mínimo).
                  PNG con fondo transparente funciona mejor.
                </p>
              </div>
            </div>

            {/* Diseños Subidos */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-4 border-purple-200">
              <h2 className="text-3xl font-black mb-6 text-purple-600 flex items-center gap-2">
                <ImageIcon className="w-8 h-8" />
                Mis Diseños
              </h2>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No tienes diseños subidos aún</p>
                  <p className="text-sm">Sube tu primer diseño para empezar</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="border-2 border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {file.thumbnail_url && (
                          <img
                            src={file.thumbnail_url}
                            alt={file.filename}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{file.filename}</p>
                          <p className="text-sm text-gray-600">
                            ID: {file.id} • {file.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {file.width}x{file.height} px
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <a
            href="/automatizaciones"
            className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl p-6 border-4 border-violet-200 hover:border-violet-400 transition-all text-center group"
          >
            <span className="text-5xl mx-auto mb-3 block group-hover:scale-110 transition-transform">🤖</span>
            <h3 className="text-xl font-black text-gray-800">Automatizaciones</h3>
            <p className="text-gray-600 text-sm mt-2">
              Pipeline IA y generación batch
            </p>
          </a>

          <a
            href="/multi-design"
            className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl p-6 border-4 border-cyan-200 hover:border-cyan-400 transition-all text-center group"
          >
            <span className="text-5xl mx-auto mb-3 block group-hover:scale-110 transition-transform">✨</span>
            <h3 className="text-xl font-black text-gray-800">Multi-Diseño</h3>
            <p className="text-gray-600 text-sm mt-2">
              Genera diseños para toda la prenda
            </p>
          </a>

          <a
            href="/promociones"
            className="bg-gradient-to-br from-red-100 to-orange-100 rounded-xl p-6 border-4 border-red-200 hover:border-red-400 transition-all text-center group"
          >
            <span className="text-5xl mx-auto mb-3 block group-hover:scale-110 transition-transform">🎁</span>
            <h3 className="text-xl font-black text-gray-800">Promociones</h3>
            <p className="text-gray-600 text-sm mt-2">
              Gestiona descuentos y ofertas
            </p>
          </a>

          <a
            href="/dashboard"
            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-4 border-purple-200 hover:border-purple-400 transition-all text-center group"
          >
            <Package className="w-12 h-12 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-black text-gray-800">Dashboard</h3>
            <p className="text-gray-600 text-sm mt-2">
              Estadísticas y métricas
            </p>
          </a>

          <a
            href="https://www.printful.com/dashboard/default/library"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-6 border-4 border-purple-200 hover:border-purple-400 transition-all text-center group"
          >
            <ImageIcon className="w-12 h-12 text-pink-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-black text-gray-800">Biblioteca Printful</h3>
            <p className="text-gray-600 text-sm mt-2">
              Ver todos tus diseños en Printful
            </p>
          </a>

          <a
            href="https://dashboard.gelato.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-4 border-purple-200 hover:border-purple-400 transition-all text-center group"
          >
            <Upload className="w-12 h-12 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-black text-gray-800">Gelato Dashboard</h3>
            <p className="text-gray-600 text-sm mt-2">
              Gestiona productos en Gelato
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
