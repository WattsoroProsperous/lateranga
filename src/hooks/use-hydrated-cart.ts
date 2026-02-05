"use client";

import { useState, useEffect } from "react";
import { useCartStore, selectTotalItems } from "@/stores/cart-store";

export function useHydratedCart() {
  const [hydrated, setHydrated] = useState(false);
  const totalItems = useCartStore(selectTotalItems);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return {
    totalItems: hydrated ? totalItems : 0,
    hydrated,
  };
}
