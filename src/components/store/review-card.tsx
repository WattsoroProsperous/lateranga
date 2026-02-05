import { Star, Quote } from "lucide-react";

interface ReviewCardProps {
  stars: number;
  text: string;
  authorName: string;
  authorInitials: string;
  date: string;
  badge?: string;
}

export function ReviewCard({
  stars,
  text,
  authorName,
  authorInitials,
  date,
  badge,
}: ReviewCardProps) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
      {/* Quote decoration */}
      <Quote className="w-8 h-8 text-primary/10 mb-3 -scale-x-100" />

      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < stars
                ? "fill-amber-500 text-amber-500"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-foreground leading-relaxed mb-6">
        {text}
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
          {authorInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {authorName}
            </span>
            {badge && (
              <span className="flex-shrink-0 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                {badge}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
    </div>
  );
}
