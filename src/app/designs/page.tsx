'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Images, Search, Download, Wand2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Design {
  id: string;
  name: string;
  imageUrl: string;
  prompt: string | null;
  placement: string | null;
  size: string | null;
  collectionId: string | null;
  createdAt: string;
  collection: { id: string; name: string } | null;
}

interface CollectionLite {
  id: string;
  name: string;
}

export default function DesignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [designs, setDesigns] = useState<Design[]>([]);
  const [collections, setCollections] = useState<CollectionLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, cRes] = await Promise.all([
        fetch('/api/admin/designs'),
        fetch('/api/admin/collections'),
      ]);
      if (!dRes.ok) throw new Error('No se pudieron cargar los diseños.');
      setDesigns(await dRes.json());
      if (cRes.ok) {
        const cols = await cRes.json();
        setCollections(cols.map((c: CollectionLite) => ({ id: c.id, name: c.name })));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = designs.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return d.name.toLowerCase().includes(q) || (d.prompt?.toLowerCase().includes(q) ?? false);
  });

  function reusePrompt(d: Design) {
    if (!d.prompt) {
      toast.info('Este diseño no tiene prompt guardado.');
      return;
    }
    localStorage.setItem('pending-prompt', d.prompt);
    router.push('/');
  }

  function download(d: Design) {
    const a = document.createElement('a');
    a.href = d.imageUrl;
    a.download = `${d.name.replace(/[^\w-]+/g, '-') || 'diseno'}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function assignCollection(d: Design, collectionId: string) {
    const value = collectionId || null;
    try {
      const res = await fetch(`/api/admin/designs/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: value }),
      });
      if (!res.ok) throw new Error();
      const updated: Design = await res.json();
      setDesigns((prev) => prev.map((x) => (x.id === d.id ? { ...x, ...updated } : x)));
      toast.success(value ? 'Añadido a la colección.' : 'Quitado de la colección.');
    } catch {
      toast.error('No se pudo actualizar la colección.');
    }
  }

  async function remove(d: Design) {
    const ok = await confirm({
      title: 'Eliminar diseño',
      message: `¿Eliminar "${d.name}"? No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/designs/${d.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDesigns((prev) => prev.filter((x) => x.id !== d.id));
      toast.success('Diseño eliminado.');
    } catch {
      toast.error('No se pudo eliminar.');
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Diseños"
        subtitle="Tu biblioteca de arte generado y guardado"
        icon={Images}
      />

      <div className="mt-6 mb-6 max-w-md">
        <label htmlFor="design-search" className="sr-only">
          Buscar diseños
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
          <input
            id="design-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o prompt…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-live="polite">
          <span className="sr-only">Cargando diseños…</span>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="aspect-square animate-pulse bg-surface-2" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center">
          <Images className="mx-auto mb-3 h-10 w-10 text-ink-subtle" aria-hidden="true" />
          <p className="font-medium text-ink">
            {designs.length === 0 ? 'Aún no has guardado ningún diseño' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {designs.length === 0
              ? 'Genera arte y pulsa "Guardar diseño" para verlo aquí.'
              : 'Prueba con otra búsqueda.'}
          </p>
          {designs.length === 0 && (
            <div className="mt-4">
              <Button variant="primary" onClick={() => router.push('/')}>
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Ir al generador
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => (
            <div key={d.id} className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
              <div className="relative aspect-square bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.imageUrl}
                  alt={d.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {d.collection && (
                  <div className="absolute left-2 top-2">
                    <Badge tone="accent">{d.collection.name}</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <p className="truncate font-medium text-ink" title={d.name}>
                  {d.name}
                </p>
                {d.prompt && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink-subtle" title={d.prompt}>
                    {d.prompt}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-subtle">
                  {new Date(d.createdAt).toLocaleDateString('es-ES')}
                </p>

                <div className="mt-3">
                  <label htmlFor={`col-${d.id}`} className="sr-only">
                    Colección de {d.name}
                  </label>
                  <select
                    id={`col-${d.id}`}
                    value={d.collectionId ?? ''}
                    onChange={(e) => assignCollection(d, e.target.value)}
                    className={`${inputClass} text-sm`}
                  >
                    <option value="">Sin colección</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => reusePrompt(d)} className="flex-1">
                    <Wand2 className="h-4 w-4" aria-hidden="true" />
                    Usar prompt
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => download(d)} aria-label={`Descargar ${d.name}`}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(d)} aria-label={`Eliminar ${d.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
