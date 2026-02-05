"use client";

import { useState } from "react";
import Image from "next/image";
import { MenuItemRow } from "./menu-item-row";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemData {
  id: string;
  name: string;
  price: number;
  priceSmall?: number | null;
  description?: string | null;
}

interface MenuCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon: LucideIcon;
  gradient: string;
  emoji: string;
  image: string;
  items: MenuItemData[];
  index?: number;
}

const INITIAL_VISIBLE = 5;

export function MenuCard({
  title,
  subtitle,
  description,
  icon: Icon,
  gradient,
  image,
  items,
  index = 0,
}: MenuCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = items.length > INITIAL_VISIBLE;
  const visibleItems = expanded ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <div
      className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-500 hover:shadow-lg hover:border-primary/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image header with food photo */}
      <div className="relative h-44 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Color accent strip at top */}
        <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", gradient)} />

        {/* Icon + title overlay */}
        <div className="absolute inset-0 z-10 flex items-end p-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg border border-white/20 flex-shrink-0",
              gradient
            )}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold text-white leading-tight drop-shadow-md truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-white/80 text-xs font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Item count badge */}
          <span className="text-xs font-bold text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 flex-shrink-0">
            {items.length} plats
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="p-5">
        {description && (
          <p className="text-muted-foreground text-sm mb-3 pb-3 border-b border-border italic">
            {description}
          </p>
        )}

        <div className="divide-y divide-border/60">
          {visibleItems.map((item) => (
            <MenuItemRow
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              priceSmall={item.priceSmall}
              description={item.description}
            />
          ))}
        </div>

        {/* Show more toggle */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-xl hover:bg-primary/5"
          >
            {expanded ? "Voir moins" : `Voir ${items.length - INITIAL_VISIBLE} de plus`}
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                expanded && "rotate-180"
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}
