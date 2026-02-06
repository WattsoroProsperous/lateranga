import { z } from "zod";

// Stock units
export const stockUnits = ["unit", "kg", "g", "l", "ml", "piece"] as const;
export type StockUnit = (typeof stockUnits)[number];

// Stock item schema
export const createStockItemSchema = z.object({
  menu_item_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Nom requis"),
  current_quantity: z.number().min(0, "Quantite invalide").default(0),
  unit: z.enum(stockUnits).default("unit"),
  min_threshold: z.number().min(0, "Seuil invalide").default(5),
  cost_per_unit: z.number().min(0, "Cout invalide").default(0),
  is_active: z.boolean().default(true),
});

export const updateStockItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Nom requis").optional(),
  current_quantity: z.number().min(0, "Quantite invalide").optional(),
  unit: z.enum(stockUnits).optional(),
  min_threshold: z.number().min(0, "Seuil invalide").optional(),
  cost_per_unit: z.number().min(0, "Cout invalide").optional(),
  is_active: z.boolean().optional(),
});

// Ingredient schema
export const createIngredientSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  current_quantity: z.number().min(0, "Quantite invalide").default(0),
  unit: z.enum(stockUnits).default("kg"),
  price_per_unit: z.number().min(0, "Prix invalide").default(0),
  min_threshold: z.number().min(0, "Seuil invalide").default(1),
  approval_threshold: z.number().min(0, "Seuil invalide").optional().nullable(),
  supplier: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const updateIngredientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Nom requis").optional(),
  description: z.string().optional().nullable(),
  current_quantity: z.number().min(0, "Quantite invalide").optional(),
  unit: z.enum(stockUnits).optional(),
  price_per_unit: z.number().min(0, "Prix invalide").optional(),
  min_threshold: z.number().min(0, "Seuil invalide").optional(),
  approval_threshold: z.number().min(0, "Seuil invalide").optional().nullable(),
  supplier: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Recipe ingredient schema
export const createRecipeIngredientSchema = z.object({
  menu_item_id: z.string().uuid(),
  ingredient_id: z.string().uuid(),
  quantity_used: z.number().positive("Quantite doit etre positive"),
});

export const updateRecipeIngredientSchema = z.object({
  id: z.string().uuid(),
  quantity_used: z.number().positive("Quantite doit etre positive"),
});

// Ingredient request schema
export const createIngredientRequestSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity: z.number().positive("Quantite doit etre positive"),
  reason: z.string().optional().nullable(),
});

export const updateIngredientRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

// Stock adjustment schema
export const stockAdjustmentSchema = z.object({
  stock_item_id: z.string().uuid().optional(),
  ingredient_id: z.string().uuid().optional(),
  movement_type: z.enum(["restock", "adjustment", "waste"]),
  quantity: z.number(),
  note: z.string().optional().nullable(),
}).refine(
  (data) => data.stock_item_id || data.ingredient_id,
  "stock_item_id ou ingredient_id requis"
);

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>;
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type CreateRecipeIngredientInput = z.infer<typeof createRecipeIngredientSchema>;
export type UpdateRecipeIngredientInput = z.infer<typeof updateRecipeIngredientSchema>;
export type CreateIngredientRequestInput = z.infer<typeof createIngredientRequestSchema>;
export type UpdateIngredientRequestInput = z.infer<typeof updateIngredientRequestSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
