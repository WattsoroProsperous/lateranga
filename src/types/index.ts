import type { Database } from "./database.types";

// Convenience type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MenuCategory = Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];
export type RestaurantSetting = Database["public"]["Tables"]["restaurant_settings"]["Row"];

// Re-export enums
export type {
  OrderStatus,
  OrderType,
  MenuTab,
  UserRole,
  ReviewSource,
} from "./database.types";

// Cart types (client-side)
export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  description?: string;
  sizeVariant?: "petit" | "grand" | null;
}

// Menu with categories (grouped for display)
export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export interface MenuByTab {
  plats: MenuCategoryWithItems[];
  desserts: MenuCategoryWithItems[];
  boissons: MenuCategoryWithItems[];
}
