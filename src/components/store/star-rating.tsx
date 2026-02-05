import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  count: number;
  max?: number;
  className?: string;
}

export function StarRating({ count, max = 5, className }: StarRatingProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-4 h-4",
            i < count
              ? "fill-amber-500 text-amber-500"
              : "fill-amber-500/20 text-amber-500/20"
          )}
        />
      ))}
    </div>
  );
}
