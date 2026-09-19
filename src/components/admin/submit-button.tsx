"use client";

import { useFormStatus } from "react-dom";
import { Save, Loader2, Trash2 } from "lucide-react";

interface Props {
  label?: string;
  pendingLabel?: string;
  variant?: "primary" | "destructive" | "destructive-inline";
  icon?: "save" | "trash" | "none";
  className?: string;
}

export function SubmitButton({
  label = "Save",
  pendingLabel = "Saving...",
  variant = "primary",
  icon = "save",
  className,
}: Props) {
  const { pending } = useFormStatus();

  if (variant === "destructive-inline") {
    return (
      <button
        type="submit"
        disabled={pending}
        className={`flex items-center gap-1 text-sm text-destructive hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${className || ""}`}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {pending ? pendingLabel : label}
      </button>
    );
  }

  if (variant === "destructive") {
    return (
      <button
        type="submit"
        disabled={pending}
        className={`flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${className || ""}`}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? pendingLabel : label}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2 disabled:opacity-60 ${className || ""}`}
    >
      {pending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : icon === "save" ? (
        <Save className="w-5 h-5" />
      ) : icon === "trash" ? (
        <Trash2 className="w-5 h-5" />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
