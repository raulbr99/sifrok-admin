'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' renders a red confirm button for destructive actions. */
  tone?: 'danger' | 'default';
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

/**
 * Promise-based accessible confirmation (replaces window.confirm()):
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '¿Eliminar "X"?', message: 'No se puede deshacer.', confirmLabel: 'Eliminar', tone: 'danger' }))) return;
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback<ConfirmFn>(
    (o) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );

  const close = (value: boolean) => {
    resolver.current(value);
    setOpts(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={opts !== null} onClose={() => close(false)} title={opts?.title ?? ''} size="sm">
        {opts?.message && <p className="text-sm text-gray-600">{opts.message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          {/* Cancel first so it receives initial focus (safer default). */}
          <Button variant="secondary" onClick={() => close(false)}>
            {opts?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button variant={opts?.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>
            {opts?.confirmLabel ?? 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
