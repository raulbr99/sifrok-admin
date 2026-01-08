'use client';

import { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  Palette,
  Shirt,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Design {
  id: string;
  imageUrl: string;
  name: string;
  placement: string;
  size: string;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  colors: { hex: string; name: string }[];
  designs: Design[];
  garmentTypes: string[];
  createdAt: string;
  updatedAt: string;
}

const GARMENT_OPTIONS = [
  { id: 'tshirt', name: 'Camiseta', icon: '👕' },
  { id: 'hoodie', name: 'Sudadera', icon: '🧥' },
  { id: 'tanktop', name: 'Tank Top', icon: '🎽' },
  { id: 'longsleeve', name: 'Manga Larga', icon: '👔' },
  { id: 'mug', name: 'Taza', icon: '☕' },
  { id: 'poster', name: 'Poster', icon: '🖼️' },
  { id: 'totebag', name: 'Tote Bag', icon: '👜' },
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // New collection form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColors, setNewColors] = useState<{ hex: string; name: string }[]>([
    { hex: '#1a1a1a', name: 'Negro' },
    { hex: '#FFFFFF', name: 'Blanco' },
  ]);
  const [newGarments, setNewGarments] = useState<string[]>(['tshirt', 'hoodie']);
  const [newColorHex, setNewColorHex] = useState('#7c3aed');
  const [newColorName, setNewColorName] = useState('');

  // Load collections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sifrok-collections');
    if (saved) {
      setCollections(JSON.parse(saved));
    }
  }, []);

  const saveCollections = (updated: Collection[]) => {
    setCollections(updated);
    localStorage.setItem('sifrok-collections', JSON.stringify(updated));
  };

  const createCollection = () => {
    if (!newName.trim()) {
      alert('El nombre es requerido');
      return;
    }

    const collection: Collection = {
      id: Date.now().toString(),
      name: newName,
      description: newDescription,
      colors: newColors,
      designs: [],
      garmentTypes: newGarments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCollections([...collections, collection]);
    resetForm();
    setShowNewModal(false);
  };

  const updateCollection = () => {
    if (!editingCollection) return;

    const updated = collections.map((c) =>
      c.id === editingCollection.id
        ? {
            ...editingCollection,
            name: newName,
            description: newDescription,
            colors: newColors,
            garmentTypes: newGarments,
            updatedAt: new Date().toISOString(),
          }
        : c
    );

    saveCollections(updated);
    resetForm();
    setEditingCollection(null);
  };

  const deleteCollection = (id: string) => {
    if (confirm('¿Eliminar esta colección?')) {
      saveCollections(collections.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewColors([
      { hex: '#1a1a1a', name: 'Negro' },
      { hex: '#FFFFFF', name: 'Blanco' },
    ]);
    setNewGarments(['tshirt', 'hoodie']);
  };

  const startEditing = (collection: Collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description);
    setNewColors(collection.colors);
    setNewGarments(collection.garmentTypes);
  };

  const addColor = () => {
    if (newColorHex && newColorName) {
      setNewColors([...newColors, { hex: newColorHex, name: newColorName }]);
      setNewColorHex('#7c3aed');
      setNewColorName('');
    }
  };

  const toggleGarment = (id: string) => {
    setNewGarments((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const addDesignToCollection = (collectionId: string, imageUrl: string) => {
    const design: Design = {
      id: Date.now().toString(),
      imageUrl,
      name: `Diseño ${Date.now()}`,
      placement: 'front-center',
      size: 'md',
      createdAt: new Date().toISOString(),
    };

    const updated = collections.map((c) =>
      c.id === collectionId
        ? { ...c, designs: [...c.designs, design], updatedAt: new Date().toISOString() }
        : c
    );

    saveCollections(updated);
  };

  const removeDesignFromCollection = (collectionId: string, designId: string) => {
    const updated = collections.map((c) =>
      c.id === collectionId
        ? { ...c, designs: c.designs.filter((d) => d.id !== designId) }
        : c
    );

    saveCollections(updated);
    if (selectedCollection) {
      setSelectedCollection(updated.find((c) => c.id === collectionId) || null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:underline text-sm mb-2 inline-block">
            ← Volver al Generador
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-purple-600" />
                Colecciones
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tus colecciones de diseños y paletas de colores
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
              Nueva Colección
            </button>
          </div>
        </div>

        {/* Collections Grid */}
        {collections.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay colecciones</h3>
            <p className="text-gray-500 mb-4">Crea tu primera colección para organizar tus diseños</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Crear Colección
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Preview */}
                <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 relative">
                  {collection.designs.length > 0 ? (
                    <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2">
                      {collection.designs.slice(0, 3).map((design) => (
                        <img
                          key={design.id}
                          src={design.imageUrl}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-purple-300" />
                    </div>
                  )}

                  {/* Color palette preview */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {collection.colors.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{collection.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {collection.description || 'Sin descripción'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {collection.designs.length} diseños
                    </span>
                    <span className="flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      {collection.colors.length} colores
                    </span>
                    <span className="flex items-center gap-1">
                      <Shirt className="w-3 h-3" />
                      {collection.garmentTypes.length} prendas
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCollection(collection)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => startEditing(collection)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New/Edit Collection Modal */}
        {(showNewModal || editingCollection) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCollection ? 'Editar Colección' : 'Nueva Colección'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowNewModal(false);
                      setEditingCollection(null);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Name & Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: Colección Verano 2025"
                      className="w-full p-3 border rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Describe tu colección..."
                      rows={2}
                      className="w-full p-3 border rounded-lg text-gray-900 bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paleta de Colores
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newColors.map((color, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                      >
                        <div
                          className="w-5 h-5 rounded-full border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm">{color.name}</span>
                        <button
                          onClick={() => setNewColors(newColors.filter((_, i) => i !== index))}
                          className="text-gray-500 hover:text-red-500"
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
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Nombre del color"
                      className="flex-1 p-2 border rounded-lg text-gray-900 bg-white"
                    />
                    <button
                      onClick={addColor}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Garment Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Prenda
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {GARMENT_OPTIONS.map((garment) => (
                      <button
                        key={garment.id}
                        onClick={() => toggleGarment(garment.id)}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          newGarments.includes(garment.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{garment.icon}</span>
                        <span className="text-xs">{garment.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNewModal(false);
                    setEditingCollection(null);
                    resetForm();
                  }}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingCollection ? updateCollection : createCollection}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  {editingCollection ? 'Guardar Cambios' : 'Crear Colección'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collection Detail Modal */}
        {selectedCollection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCollection.name}</h2>
                    <p className="text-sm text-gray-500">{selectedCollection.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Color Palette */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    Paleta de Colores
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedCollection.colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                        <div
                          className="w-8 h-8 rounded-lg border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div>
                          <p className="font-medium text-sm">{color.name}</p>
                          <p className="text-xs text-gray-500">{color.hex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Garment Types */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-purple-600" />
                    Prendas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCollection.garmentTypes.map((gId) => {
                      const garment = GARMENT_OPTIONS.find((g) => g.id === gId);
                      return garment ? (
                        <span
                          key={gId}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {garment.icon} {garment.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Designs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                      Diseños ({selectedCollection.designs.length})
                    </h3>
                    <Link
                      href="/studio"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Diseño
                    </Link>
                  </div>

                  {selectedCollection.designs.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">No hay diseños en esta colección</p>
                      <Link
                        href="/"
                        className="inline-block mt-3 text-purple-600 hover:underline"
                      >
                        Ir al Generador
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedCollection.designs.map((design) => (
                        <div
                          key={design.id}
                          className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                        >
                          <img
                            src={design.imageUrl}
                            alt={design.name}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              className="p-2 bg-white rounded-lg hover:bg-gray-100"
                              title="Editar en Studio"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeDesignFromCollection(selectedCollection.id, design.id)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Export */}
                <div className="mt-6 pt-6 border-t flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <Download className="w-4 h-4" />
                    Exportar Colección
                  </button>
                  <a
                    href="https://dashboard.gelato.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Subir a Gelato
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
