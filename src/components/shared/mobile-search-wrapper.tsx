"use client";

import { useSearch } from "./search-context";
import { MobileSearchOverlay } from "./mobile-search";

export function MobileSearchOverlayWrapper() {
  const { isSearchOpen, closeSearch } = useSearch();
  return <MobileSearchOverlay open={isSearchOpen} onClose={closeSearch} />;
}
