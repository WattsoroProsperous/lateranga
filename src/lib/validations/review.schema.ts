import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, "L'avis doit contenir au moins 10 caractères"),
  author_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

export const moderateReviewSchema = z.object({
  id: z.string().uuid(),
  is_approved: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
