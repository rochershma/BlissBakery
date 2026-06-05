"use client";

import { formatPrice } from "@/lib/utils";

interface StickyAddToCartProps {
  price: number;
  onAdd: () => void;
  loading?: boolean;
  label?: string;
}

export function StickyAddToCart({ price, onAdd, loading, label = "Add to Cart" }: StickyAddToCartProps) {
  return (
    <div className="sticky-cta-bar">
      <span className="sticky-cta-price">{formatPrice(price)}</span>
      <button
        onClick={onAdd}
        disabled={loading}
        className="sticky-cta-btn"
      >
        {loading ? "Adding..." : label}
      </button>
    </div>
  );
}

interface StickyCheckoutBarProps {
  total: number;
  label?: string;
  onClick: () => void;
  loading?: boolean;
}

export function StickyCheckoutBar({ total, label = "Checkout", onClick, loading }: StickyCheckoutBarProps) {
  return (
    <div className="sticky-checkout-bar">
      <span className="sticky-cta-price">{formatPrice(total)}</span>
      <button
        onClick={onClick}
        disabled={loading}
        className="sticky-cta-btn"
      >
        {loading ? "Processing..." : label}
      </button>
    </div>
  );
}
