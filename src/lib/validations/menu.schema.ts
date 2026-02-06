import { z } from "zod";

// Regex pour valider le format UUID (sans vérifier la version)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createMenuItemSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0, "Le prix doit être positif"),
  price_small: z.number().int().min(0).optional().nullable(),
  category_id: z.string().regex(uuidRegex, "Catégorie invalide"),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  requires_order: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
