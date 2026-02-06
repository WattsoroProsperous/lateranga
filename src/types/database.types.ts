/**
 * Database types for Supabase.
 * In production, auto-generate with: npx supabase gen types typescript
 * For now, manually defined to match our schema.
 */

// ============================================
// Enums
// ============================================

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

export type UserRole = "customer" | "admin" | "super_admin" | "cashier" | "chef";

export type ReviewSource = "google" | "website";

export type TableLocation = "interieur" | "terrasse" | "vip";

export type StockUnit = "unit" | "kg" | "g" | "l" | "ml" | "piece";

export type StockMovementType = "sale" | "restock" | "adjustment" | "request" | "waste" | "return" | "withdrawal";

export type IngredientType = "unit" | "weighable";

export type RequestStatus = "pending" | "approved" | "rejected";

export type RequestType = "stock_request" | "withdrawal_approval";

export type PaymentMethod = "cash" | "card" | "wave" | "orange_money" | "mtn_money";

export type PaymentStatus = "pending" | "paid" | "refunded" | "cancelled";

export type NotificationType =
  | "new_order"
  | "order_cancelled"
  | "order_ready"
  | "low_stock"
  | "ingredient_request"
  | "payment_validated"
  | "table_order";

export type AuditActionType = "delete" | "modify" | "cancel";

// ============================================
// Database Interface
// ============================================

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
          // Table references
          table_session_id: string | null;
          table_id: string | null;
          // Payment fields
          payment_status: PaymentStatus;
          payment_method: PaymentMethod | null;
          paid_at: string | null;
          paid_amount: number;
          validated_by: string | null;
          payment_reference: string | null;
          // Legacy WhatsApp fields
          whatsapp_message_id: string | null;
          whatsapp_sent_at: string | null;
          // Timestamps
          confirmed_at: string | null;
          prepared_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          // Soft delete fields (admin only)
          deleted_at: string | null;
          deleted_by: string | null;
          deletion_reason: string | null;
          // Cost tracking for profit calculation
          total_cost: number;
          profit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          order_number?: string;
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
          table_session_id?: string | null;
          table_id?: string | null;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod | null;
        };
        Update: {
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod | null;
          paid_at?: string | null;
          paid_amount?: number;
          validated_by?: string | null;
          payment_reference?: string | null;
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
          {
            foreignKeyName: "orders_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_table_session_id_fkey";
            columns: ["table_session_id"];
            isOneToOne: false;
            referencedRelation: "table_sessions";
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
      // ============================================
      // Table Management
      // ============================================
      restaurant_tables: {
        Row: {
          id: string;
          table_number: number;
          name: string;
          qr_code_token: string;
          capacity: number;
          location: TableLocation | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          table_number: number;
          name: string;
          qr_code_token?: string;
          capacity?: number;
          location?: TableLocation | null;
          is_active?: boolean;
        };
        Update: {
          table_number?: number;
          name?: string;
          qr_code_token?: string;
          capacity?: number;
          location?: TableLocation | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      table_sessions: {
        Row: {
          id: string;
          table_id: string;
          session_token: string;
          started_at: string;
          expires_at: string;
          ended_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          table_id: string;
          session_token?: string;
          expires_at?: string;
          is_active?: boolean;
        };
        Update: {
          is_active?: boolean;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "table_sessions_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      // ============================================
      // Stock Management
      // ============================================
      stock_items: {
        Row: {
          id: string;
          menu_item_id: string | null;
          name: string;
          description: string | null;
          current_quantity: number;
          unit: StockUnit;
          min_threshold: number;
          cost_per_unit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          menu_item_id?: string | null;
          name: string;
          description?: string | null;
          current_quantity?: number;
          unit?: StockUnit;
          min_threshold?: number;
          cost_per_unit?: number;
          is_active?: boolean;
        };
        Update: {
          menu_item_id?: string | null;
          name?: string;
          description?: string | null;
          current_quantity?: number;
          unit?: StockUnit;
          min_threshold?: number;
          cost_per_unit?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "stock_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          current_quantity: number;
          unit: StockUnit;
          price_per_unit: number;
          min_threshold: number;
          approval_threshold: number | null;
          supplier: string | null;
          ingredient_type: IngredientType;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          current_quantity?: number;
          unit?: StockUnit;
          price_per_unit: number;
          min_threshold?: number;
          approval_threshold?: number | null;
          supplier?: string | null;
          ingredient_type?: IngredientType;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          current_quantity?: number;
          unit?: StockUnit;
          price_per_unit?: number;
          min_threshold?: number;
          approval_threshold?: number | null;
          supplier?: string | null;
          ingredient_type?: IngredientType;
          is_active?: boolean;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          menu_item_id: string;
          ingredient_id: string;
          quantity_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          menu_item_id: string;
          ingredient_id: string;
          quantity_used: number;
        };
        Update: {
          quantity_used?: number;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredient_requests: {
        Row: {
          id: string;
          ingredient_id: string;
          requested_by: string | null;
          quantity: number;
          reason: string | null;
          notes: string | null;
          status: RequestStatus;
          request_type: RequestType;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ingredient_id: string;
          requested_by?: string | null;
          quantity: number;
          reason?: string | null;
          notes?: string | null;
          status?: RequestStatus;
          request_type?: RequestType;
        };
        Update: {
          status?: RequestStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingredient_requests_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingredient_requests_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          stock_item_id: string | null;
          ingredient_id: string | null;
          movement_type: StockMovementType;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reference_id: string | null;
          reference_type: string | null;
          note: string | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          stock_item_id?: string | null;
          ingredient_id?: string | null;
          movement_type: StockMovementType;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reference_id?: string | null;
          reference_type?: string | null;
          note?: string | null;
          performed_by?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey";
            columns: ["stock_item_id"];
            isOneToOne: false;
            referencedRelation: "stock_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      // ============================================
      // Notifications
      // ============================================
      notifications: {
        Row: {
          id: string;
          type: NotificationType;
          title: string;
          message: string;
          data: Record<string, unknown>;
          target_roles: UserRole[];
          target_user_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          type: NotificationType;
          title: string;
          message: string;
          data?: Record<string, unknown>;
          target_roles: UserRole[];
          target_user_id?: string | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ============================================
      // Audit Log (Security)
      // ============================================
      order_audit_log: {
        Row: {
          id: string;
          action_type: AuditActionType;
          actor_id: string;
          actor_role: string;
          actor_name: string | null;
          order_id: string;
          order_number: string;
          order_data: Record<string, unknown>;
          reason: string;
          changes: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          action_type: AuditActionType;
          actor_id: string;
          actor_role: string;
          actor_name?: string | null;
          order_id: string;
          order_number: string;
          order_data: Record<string, unknown>;
          reason: string;
          changes?: Record<string, unknown> | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "order_audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ============================================
      // Daily Summaries (Profit Tracking)
      // ============================================
      daily_summaries: {
        Row: {
          id: string;
          date: string;
          total_revenue: number;
          total_cost: number;
          total_profit: number;
          total_orders: number;
          revenue_by_category: Record<string, number>;
          cost_by_category: Record<string, number>;
          orders_by_hour: Record<string, number>;
          top_items: Array<{ name: string; quantity: number; revenue: number }>;
          stock_items_cost: number;
          ingredients_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          date: string;
          total_revenue?: number;
          total_cost?: number;
          total_profit?: number;
          total_orders?: number;
          revenue_by_category?: Record<string, number>;
          cost_by_category?: Record<string, number>;
          orders_by_hour?: Record<string, number>;
          top_items?: Array<{ name: string; quantity: number; revenue: number }>;
          stock_items_cost?: number;
          ingredients_cost?: number;
        };
        Update: {
          total_revenue?: number;
          total_cost?: number;
          total_profit?: number;
          total_orders?: number;
          revenue_by_category?: Record<string, number>;
          cost_by_category?: Record<string, number>;
          orders_by_hour?: Record<string, number>;
          top_items?: Array<{ name: string; quantity: number; revenue: number }>;
          stock_items_cost?: number;
          ingredients_cost?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_has_role: {
        Args: { required_roles: UserRole[] };
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_manager: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      create_table_session: {
        Args: { p_table_token: string };
        Returns: {
          session_id: string;
          session_token: string;
          table_name: string;
          expires_at: string;
        }[];
      };
      validate_payment: {
        Args: {
          p_order_id: string;
          p_payment_method: PaymentMethod;
          p_paid_amount: number;
          p_validated_by: string;
          p_reference?: string | null;
        };
        Returns: void;
      };
      get_unpaid_orders: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          order_number: string;
          client_name: string;
          total: number;
          status: OrderStatus;
          table_name: string | null;
          created_at: string;
        }[];
      };
      get_low_stock_items: {
        Args: Record<string, never>;
        Returns: {
          item_type: string;
          item_id: string;
          name: string;
          current_quantity: number;
          min_threshold: number;
          unit: StockUnit;
        }[];
      };
      calculate_item_cost: {
        Args: { p_menu_item_id: string };
        Returns: number;
      };
      calculate_order_cost: {
        Args: { p_order_id: string };
        Returns: number;
      };
      chef_withdraw_ingredient: {
        Args: {
          p_ingredient_id: string;
          p_quantity: number;
          p_note?: string | null;
          p_chef_id?: string | null;
        };
        Returns: {
          success: boolean;
          needs_approval?: boolean;
          request_id?: string;
          movement_id?: string;
          new_quantity?: number;
          message?: string;
          error?: string;
          available?: number;
        };
      };
      approve_withdrawal_request: {
        Args: {
          p_request_id: string;
          p_admin_id: string;
        };
        Returns: {
          success: boolean;
          movement_id?: string;
          new_quantity?: number;
          error?: string;
        };
      };
      reject_withdrawal_request: {
        Args: {
          p_request_id: string;
          p_admin_id: string;
          p_reason?: string | null;
        };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
      get_daily_profit: {
        Args: { p_days?: number };
        Returns: {
          date: string;
          revenue: number;
          cost: number;
          profit: number;
          orders: number;
          profit_margin: number;
        }[];
      };
      get_peak_hours_analysis: {
        Args: { p_days?: number };
        Returns: {
          hour: number;
          total_orders: number;
          avg_orders_per_day: number;
        }[];
      };
      get_item_profit_margins: {
        Args: Record<string, never>;
        Returns: {
          item_id: string;
          item_name: string;
          category_name: string;
          sale_price: number;
          cost_price: number;
          profit: number;
          profit_margin: number;
          total_sold: number;
          total_revenue: number;
          total_profit: number;
        }[];
      };
      check_and_notify_low_stock: {
        Args: Record<string, never>;
        Returns: {
          item_type: string;
          item_id: string;
          name: string;
          current_quantity: number;
          min_threshold: number;
          unit: string;
          needs_restock: boolean;
        }[];
      };
    };
    Enums: {
      order_status: OrderStatus;
      order_type: OrderType;
      menu_tab: MenuTab;
      user_role: UserRole;
      review_source: ReviewSource;
      table_location: TableLocation;
      stock_unit: StockUnit;
      stock_movement_type: StockMovementType;
      request_status: RequestStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ============================================
// Convenience Types
// ============================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Shorthand types
export type Profile = Tables<"profiles">;
export type MenuCategory = Tables<"menu_categories">;
export type MenuItem = Tables<"menu_items">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderStatusHistory = Tables<"order_status_history">;
export type Review = Tables<"reviews">;
export type GalleryImage = Tables<"gallery_images">;
export type RestaurantSetting = Tables<"restaurant_settings">;
export type RestaurantTable = Tables<"restaurant_tables">;
export type TableSession = Tables<"table_sessions">;
export type StockItem = Tables<"stock_items">;
export type Ingredient = Tables<"ingredients">;
export type RecipeIngredient = Tables<"recipe_ingredients">;
export type IngredientRequest = Tables<"ingredient_requests">;
export type StockMovement = Tables<"stock_movements">;
export type Notification = Tables<"notifications">;
export type OrderAuditLog = Tables<"order_audit_log">;
export type DailySummary = Tables<"daily_summaries">;
