'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Tag, Calendar, TrendingUp } from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  code: string | null;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  minAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  applyTo: 'ALL' | 'CATEGORY' | 'PRODUCT';
  categoryFilter: string | null;
  productFilter: string | null;
  createdAt: string;
}

export default function PromocionesAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: '',
    isActive: true,
    startDate: '',
    endDate: '',
    minAmount: '',
    maxUses: '',
    applyTo: 'ALL' as 'ALL' | 'CATEGORY' | 'PRODUCT',
    categoryFilter: '',
    productFilter: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchPromotions();
    }
  }, [status, router]);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/admin/promotions');
      const data = await response.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPromotion
        ? `/api/admin/promotions/${editingPromotion.id}`
        : '/api/admin/promotions';

      const method = editingPromotion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingPromotion ? 'Promoción actualizada' : 'Promoción creada');
        setShowModal(false);
        resetForm();
        fetchPromotions();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Error al guardar promoción');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Promoción eliminada');
        fetchPromotions();
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Error al eliminar promoción');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      code: promotion.code || '',
      type: promotion.type,
      value: promotion.value.toString(),
      isActive: promotion.isActive,
      startDate: promotion.startDate ? promotion.startDate.split('T')[0] : '',
      endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
      minAmount: promotion.minAmount?.toString() || '',
      maxUses: promotion.maxUses?.toString() || '',
      applyTo: promotion.applyTo,
      categoryFilter: promotion.categoryFilter || '',
      productFilter: promotion.productFilter || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      code: '',
      type: 'PERCENTAGE',
      value: '',
      isActive: true,
      startDate: '',
      endDate: '',
      minAmount: '',
      maxUses: '',
      applyTo: 'ALL',
      categoryFilter: '',
      productFilter: '',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Promociones y Descuentos
            </h1>
            <p className="text-gray-600 mt-2">Gestiona tus ofertas y códigos promocionales</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Promoción
          </button>
        </div>

        {/* Lista de promociones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-4 ${
                promo.isActive ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-800">{promo.name}</h3>
                  {promo.code && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="w-4 h-4 text-purple-600" />
                      <span className="font-mono font-bold text-purple-600">{promo.code}</span>
                    </div>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {promo.isActive ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-black text-purple-600">
                  {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `€${promo.value}`}
                </div>
                <p className="text-sm text-gray-600">
                  {promo.type === 'PERCENTAGE' ? 'Descuento porcentual' : 'Descuento fijo'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {promo.minAmount && (
                  <p>• Compra mínima: €{promo.minAmount}</p>
                )}
                {promo.maxUses && (
                  <p>• Usos: {promo.currentUses}/{promo.maxUses}</p>
                )}
                {promo.startDate && (
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(promo.startDate).toLocaleDateString('es-ES')}
                    {promo.endDate && ` - ${new Date(promo.endDate).toLocaleDateString('es-ES')}`}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(promo)}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-full font-bold hover:bg-red-600 transition-all flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {promotions.length === 0 && !loading && (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 font-bold">
              No hay promociones creadas
            </p>
            <p className="text-gray-400 mt-2">
              Crea tu primera promoción para atraer clientes
            </p>
          </div>
        )}

        {/* Modal de crear/editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-3xl font-black mb-6 text-purple-600">
                {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-bold text-gray-700">
                    Nombre de la promoción *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Black Friday 2024"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold text-gray-700">
                    Código promocional (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VERANO20"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 uppercase"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Deja vacío para descuento automático sin código
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-bold text-gray-700">
                      Tipo de descuento *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED_AMOUNT">Cantidad fija (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-gray-700">
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'PERCENTAGE' ? '20' : '5.00'}
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-bold text-gray-700">
                      Fecha inicio (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-gray-700">
                      Fecha fin (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-bold text-gray-700">
                      Compra mínima (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                      placeholder="50.00"
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-gray-700">
                      Máximo de usos
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      placeholder="100"
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="font-bold text-gray-700">Promoción activa</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-400 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    {editingPromotion ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
