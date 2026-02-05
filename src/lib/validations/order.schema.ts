import { z } from "zod";

export const createOrderSchema = z.object({
  client_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  client_phone: z.string().min(8, "Numéro de téléphone invalide"),
  order_type: z.enum(["sur_place", "emporter", "livraison"]),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().int(),
        qty: z.number().int().min(1),
        sizeVariant: z.enum(["petit", "grand"]).optional().nullable(),
      })
    )
    .min(1, "Le panier est vide"),
});

export const updateOrderStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivering",
    "completed",
    "cancelled",
  ]),
  cancellation_reason: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
