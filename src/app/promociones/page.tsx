'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Tag, Calendar, TrendingUp } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import { inputClass } from '@/components/ui/Field';

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
  const { toast } = useToast();
  const confirm = useConfirm();
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
        toast.success(editingPromotion ? 'Promoción actualizada.' : 'Promoción creada.');
        setShowModal(false);
        resetForm();
        fetchPromotions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'No se pudo guardar la promoción. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('No se pudo guardar la promoción. Inténtalo de nuevo.');
    }
  };

  const handleDelete = async (id: string) => {
    const promotion = promotions.find((p) => p.id === id);
    const confirmed = await confirm({
      title: `¿Eliminar "${promotion?.name ?? 'esta promoción'}"?`,
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Promoción eliminada.');
        fetchPromotions();
      } else {
        toast.error('No se pudo eliminar la promoción. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('No se pudo eliminar la promoción. Inténtalo de nuevo.');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ink border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <PageHeader
          title="Promociones y Descuentos"
          subtitle="Gestiona tus ofertas y códigos promocionales"
          actions={
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Nueva Promoción
            </Button>
          }
        />

        {/* Lista de promociones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <Card key={promo.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-ink">{promo.name}</h3>
                  {promo.code && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                      <span className="font-mono font-bold text-ink">{promo.code}</span>
                    </div>
                  )}
                </div>
                <Badge tone={promo.isActive ? 'success' : 'neutral'}>
                  {promo.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-black text-ink">
                  {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `€${promo.value}`}
                </div>
                <p className="text-sm text-ink-muted">
                  {promo.type === 'PERCENTAGE' ? 'Descuento porcentual' : 'Descuento fijo'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-ink-muted mb-4">
                {promo.minAmount && (
                  <p>• Compra mínima: €{promo.minAmount}</p>
                )}
                {promo.maxUses && (
                  <p>• Usos: {promo.currentUses}/{promo.maxUses}</p>
                )}
                {promo.startDate && (
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {new Date(promo.startDate).toLocaleDateString('es-ES')}
                    {promo.endDate && ` - ${new Date(promo.endDate).toLocaleDateString('es-ES')}`}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleEdit(promo)} className="flex-1">
                  <Edit className="w-4 h-4" aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(promo.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {promotions.length === 0 && !loading && (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-ink-subtle mx-auto mb-4" aria-hidden="true" />
            <p className="text-xl text-ink-muted font-bold">
              No hay promociones creadas
            </p>
            <p className="text-ink-muted mt-2">
              Crea tu primera promoción para atraer clientes
            </p>
          </div>
        )}

        {/* Modal de crear/editar */}
        <Modal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="promo-name" className="block mb-2 font-bold text-ink">
                Nombre de la promoción *
              </label>
              <input
                id="promo-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Black Friday 2024"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="promo-code" className="block mb-2 font-bold text-ink">
                Código promocional (opcional)
              </label>
              <input
                id="promo-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VERANO20"
                className={`${inputClass} uppercase`}
              />
              <p className="text-sm text-ink-muted mt-1">
                Deja vacío para descuento automático sin código
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="promo-type" className="block mb-2 font-bold text-ink">
                  Tipo de descuento *
                </label>
                <select
                  id="promo-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED_AMOUNT">Cantidad fija (€)</option>
                </select>
              </div>

              <div>
                <label htmlFor="promo-value" className="block mb-2 font-bold text-ink">
                  Valor *
                </label>
                <input
                  id="promo-value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'PERCENTAGE' ? '20' : '5.00'}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="promo-start-date" className="block mb-2 font-bold text-ink">
                  Fecha inicio (opcional)
                </label>
                <input
                  id="promo-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="promo-end-date" className="block mb-2 font-bold text-ink">
                  Fecha fin (opcional)
                </label>
                <input
                  id="promo-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="promo-min-amount" className="block mb-2 font-bold text-ink">
                  Compra mínima (€)
                </label>
                <input
                  id="promo-min-amount"
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="50.00"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="promo-max-uses" className="block mb-2 font-bold text-ink">
                  Máximo de usos
                </label>
                <input
                  id="promo-max-uses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="100"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="promo-active" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="promo-active"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="font-bold text-ink">Promoción activa</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingPromotion ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
