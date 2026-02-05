import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md";
  className?: string;
}

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white font-display font-bold italic",
        size === "md" && "w-10 h-10 rounded-xl text-lg",
        size === "sm" && "w-8 h-8 rounded-lg text-sm",
        className
      )}
    >
      Lt
    </div>
  );
}
