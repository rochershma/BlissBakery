"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function SubmitIcon({ children, className = "" }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`disabled:opacity-40 transition-opacity ${className}`}
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}
