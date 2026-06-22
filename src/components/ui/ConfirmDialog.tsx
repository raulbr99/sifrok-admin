'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';

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
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          >
            {opts?.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 ${
              opts?.tone === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
                : 'bg-purple-600 hover:bg-purple-700 focus-visible:outline-purple-600'
            }`}
          >
            {opts?.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
