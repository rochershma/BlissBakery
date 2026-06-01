"use client";

import { useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmDeleteForm({
  action,
  confirmMessage,
  children,
  hiddenInputs,
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children: React.ReactNode;
  hiddenInputs?: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <form
        ref={formRef}
        action={(formData) => {
          action(formData);
          setShowConfirm(false);
        }}
      >
        {hiddenInputs &&
          Object.entries(hiddenInputs).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        <div onClick={(e) => { e.preventDefault(); setShowConfirm(true); }}>
          {children}
        </div>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-[calc(100%-2rem)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground">Delete?</h3>
                <p className="text-sm text-muted-foreground mt-1">{confirmMessage}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => formRef.current?.requestSubmit()} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
