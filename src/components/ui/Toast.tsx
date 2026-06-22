'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}
interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

/** Accessible toast notifications (replaces alert()). */
export function useToast(): { toast: ToastApi } {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return { toast: ctx };
}

const STYLES: Record<ToastType, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-green-200 bg-green-50 text-green-800' },
  error: { icon: AlertCircle, cls: 'border-red-200 bg-red-50 text-red-800' },
  info: { icon: Info, cls: 'border-gray-200 bg-white text-gray-800' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setItems((s) => [...s, { id, type, message }]);
      setTimeout(() => remove(id), type === 'error' ? 7000 : 4500);
    },
    [remove],
  );

  const apiRef = useRef<ToastApi>({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  });

  return (
    <ToastCtx.Provider value={apiRef.current}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((t) => {
          const S = STYLES[t.type];
          const Icon = S.icon;
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm shadow-md motion-safe:animate-[fadeIn_150ms_ease-out] ${S.cls}`}
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <p className="flex-1 break-words">{t.message}</p>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Cerrar aviso"
                className="rounded p-0.5 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
