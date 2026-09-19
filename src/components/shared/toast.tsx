"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    // Prevent duplicate toasts with same message
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      const id = ++toastId;
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
      // Keep max 2 visible
      const trimmed = prev.length >= 2 ? prev.slice(-1) : prev;
      return [...trimmed, { id, message, type }];
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle className="toast5__i toast5__i--ok" />,
    error: <AlertTriangle className="toast5__i toast5__i--err" />,
    info: <Info className="toast5__i toast5__i--info" />,
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="toast5">
        {toasts.map((t) => (
          <div key={t.id} className={`toast5__t toast5__t--${t.type}`} role="status">
            {icons[t.type]}
            <span className="toast5__m">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="toast5__x" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
