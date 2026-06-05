import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const separator = baseUrl.includes("?") ? "&" : "?";

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {currentPage > 1 && (
        <Link href={`${baseUrl}${separator}page=${currentPage - 1}`}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
        .map((p, idx, arr) => (
          <span key={p} className="inline-flex">
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground px-1 self-center">...</span>}
            <Link href={`${baseUrl}${separator}page=${p}`}
              className={`w-9 h-9 rounded-xl inline-flex items-center justify-center text-sm font-medium transition-colors ${
                p === currentPage ? "bg-primary text-white" : "border border-border hover:bg-muted"
              }`}>
              {p}
            </Link>
          </span>
        ))
      }
      {currentPage < totalPages && (
        <Link href={`${baseUrl}${separator}page=${currentPage + 1}`}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
