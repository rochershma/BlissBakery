"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";

export default function NotFoundPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 text-center bg-background">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className="text-4xl">🍰</span>
      </div>
      <h1 className="text-3xl font-bold text-foreground font-serif mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Oops! This page doesn&apos;t exist. But our delicious cakes do!
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Redirecting to home in <span className="font-bold text-primary">{countdown}s</span>...
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors"
        >
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 border border-border px-6 py-3 rounded-full font-medium text-foreground hover:bg-muted transition-colors"
        >
          Browse Menu <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
