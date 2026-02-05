/**
 * Database types for Supabase.
 * In production, auto-generate with: npx supabase gen types typescript
 * For now, manually defined to match our schema.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export type OrderType = "sur_place" | "emporter" | "livraison";

export type MenuTab = "plats" | "desserts" | "boissons";

export type UserRole = "customer" | "admin";

export type ReviewSource = "google" | "website";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tab: MenuTab;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          tab: MenuTab;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          tab?: MenuTab;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          legacy_id: string | null;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          price_small: number | null;
          image_url: string | null;
          is_available: boolean;
          is_featured: boolean;
          requires_order: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          legacy_id?: string | null;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          price_small?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          requires_order?: boolean;
          sort_order?: number;
        };
        Update: {
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          price_small?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          requires_order?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          status: OrderStatus;
          order_type: OrderType;
          client_name: string;
          client_phone: string;
          delivery_address: string | null;
          notes: string | null;
          subtotal: number;
          delivery_fee: number;
          total: number;
          whatsapp_message_id: string | null;
          whatsapp_sent_at: string | null;
          confirmed_at: string | null;
          prepared_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          order_number: string;
          customer_id?: string | null;
          status?: OrderStatus;
          order_type: OrderType;
          client_name: string;
          client_phone: string;
          delivery_address?: string | null;
          notes?: string | null;
          subtotal: number;
          delivery_fee?: number;
          total: number;
        };
        Update: {
          status?: OrderStatus;
          whatsapp_message_id?: string | null;
          whatsapp_sent_at?: string | null;
          confirmed_at?: string | null;
          prepared_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          item_price: number;
          quantity: number;
          line_total: number;
          size_variant: string | null;
          created_at: string;
        };
        Insert: {
          order_id: string;
          menu_item_id?: string | null;
          item_name: string;
          item_price: number;
          quantity: number;
          line_total: number;
          size_variant?: string | null;
        };
        Update: {
          order_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          item_price?: number;
          quantity?: number;
          line_total?: number;
          size_variant?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          old_status: OrderStatus | null;
          new_status: OrderStatus;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          order_id: string;
          old_status?: OrderStatus | null;
          new_status: OrderStatus;
          changed_by?: string | null;
          note?: string | null;
        };
        Update: {
          order_id?: string;
          old_status?: OrderStatus | null;
          new_status?: OrderStatus;
          changed_by?: string | null;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          customer_id: string | null;
          rating: number;
          text: string | null;
          author_name: string;
          author_initials: string | null;
          source: ReviewSource;
          is_local_guide: boolean;
          is_approved: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id?: string | null;
          rating: number;
          text?: string | null;
          author_name: string;
          author_initials?: string | null;
          source?: ReviewSource;
          is_local_guide?: boolean;
          is_approved?: boolean;
          is_featured?: boolean;
        };
        Update: {
          rating?: number;
          text?: string | null;
          is_approved?: boolean;
          is_featured?: boolean;
        };
        Relationships: [];
      };
      gallery_images: {
        Row: {
          id: string;
          storage_path: string | null;
          url: string;
          alt_text: string | null;
          image_type: string | null;
          is_large: boolean;
          sort_order: number;
          is_active: boolean;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          storage_path?: string | null;
          url: string;
          alt_text?: string | null;
          image_type?: string | null;
          is_large?: boolean;
          sort_order?: number;
          is_active?: boolean;
          uploaded_by?: string | null;
        };
        Update: {
          alt_text?: string | null;
          image_type?: string | null;
          is_large?: boolean;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      restaurant_settings: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Record<string, unknown>;
          description?: string | null;
        };
        Update: {
          value?: Record<string, unknown>;
          description?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatus;
      order_type: OrderType;
      menu_tab: MenuTab;
      user_role: UserRole;
      review_source: ReviewSource;
    };
    CompositeTypes: Record<string, never>;
  };
}
