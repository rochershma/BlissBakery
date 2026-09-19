"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) });

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleResponse = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => handleResponse(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-[calc(100%-2rem)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${state.options.destructive ? "bg-red-100" : "bg-primary/10"}`}>
                <AlertTriangle className={`w-5 h-5 ${state.options.destructive ? "text-red-600" : "text-primary"}`} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground">{state.options.title || "Confirm"}</h3>
                <p className="text-sm text-muted-foreground mt-1">{state.options.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleResponse(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {state.options.cancelLabel || "Cancel"}
              </button>
              <button
                onClick={() => handleResponse(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  state.options.destructive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                }`}
              >
                {state.options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
