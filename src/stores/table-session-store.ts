import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TableSession, RestaurantTable } from "@/types/database.types";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  sizeVariant?: "petit" | "grand";
}

interface TableSessionState {
  session: TableSession | null;
  table: RestaurantTable | null;
  cart: CartItem[];
  setSession: (session: TableSession | null, table: RestaurantTable | null) => void;
  clearSession: () => void;
  addToCart: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  isSessionValid: () => boolean;
}

export const useTableSessionStore = create<TableSessionState>()(
  persist(
    (set, get) => ({
      session: null,
      table: null,
      cart: [],

      setSession: (session, table) => {
        set({ session, table, cart: [] });
      },

      clearSession: () => {
        set({ session: null, table: null, cart: [] });
      },

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find(
            (c) => c.id === item.id && c.sizeVariant === item.sizeVariant
          );
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.id === item.id && c.sizeVariant === item.sizeVariant
                  ? { ...c, qty: c.qty + 1 }
                  : c
              ),
            };
          }
          return { cart: [...state.cart, { ...item, qty: 1 }] };
        });
      },

      updateQty: (id, delta) => {
        set((state) => ({
          cart: state.cart
            .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
            .filter((c) => c.qty > 0),
        }));
      },

      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((c) => c.id !== id),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      getTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      },

      isSessionValid: () => {
        const { session } = get();
        if (!session) return false;
        return new Date(session.expires_at) > new Date() && session.is_active;
      },
    }),
    {
      name: "table-session",
      partialize: (state) => ({
        session: state.session,
        table: state.table,
        cart: state.cart,
      }),
    }
  )
);
