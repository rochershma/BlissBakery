"use client";

import { useRef } from "react";

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

  return (
    <form
      ref={formRef}
      action={(formData) => {
        if (!window.confirm(confirmMessage)) return;
        action(formData);
      }}
    >
      {hiddenInputs &&
        Object.entries(hiddenInputs).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {children}
    </form>
  );
}
