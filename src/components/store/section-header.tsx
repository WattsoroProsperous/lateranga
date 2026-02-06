import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  tag: string;
  title: string;
  description?: string;
  className?: string;
  dark?: boolean;
}

export function SectionHeader({
  tag,
  title,
  description,
  className,
  dark,
}: SectionHeaderProps) {
  return (
    <div className={cn("text-center mb-14", className)}>
      <span className="inline-block px-3 py-1.5 bg-primary/8 text-primary text-[11px] font-bold uppercase tracking-widest rounded-full mb-5">
        {tag}
      </span>
      <h2
        className={cn(
          "font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4",
          dark ? "text-neutral-100" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn(
          "text-base max-w-lg mx-auto leading-relaxed",
          dark ? "text-neutral-400" : "text-muted-foreground"
        )}>
          {description}
        </p>
      )}
    </div>
  );
}
