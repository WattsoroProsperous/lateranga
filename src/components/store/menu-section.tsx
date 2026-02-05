"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/container";
import { SectionHeader } from "./section-header";
import { MenuCard } from "./menu-card";
import { menuTabs } from "@/lib/constants/menu-data";

export function MenuSection() {
  const [activeTab, setActiveTab] = useState("plats");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const currentTab = menuTabs.find((t) => t.value === activeTab);

  // Animate underline indicator
  useEffect(() => {
    const container = tabsRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const activeButton = container.querySelector(
      `[data-tab="${activeTab}"]`
    ) as HTMLButtonElement | null;
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    indicator.style.left = `${buttonRect.left - containerRect.left}px`;
    indicator.style.width = `${buttonRect.width}px`;
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(value);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <section id="menu" className="py-20 md:py-28 px-4 sm:px-6 bg-secondary/50">
      <Container>
        <SectionHeader
          tag="Notre Carte"
          title="Saveurs du Sénégal"
          description="Des plats authentiques préparés avec passion, mettant en valeur les richesses de la cuisine sénégalaise traditionnelle."
        />

        {/* Tabs */}
        <div className="flex justify-center mb-14">
          <div
            ref={tabsRef}
            className="relative inline-flex items-center gap-1 p-1.5 bg-muted/80 rounded-2xl border border-border"
          >
            {/* Sliding indicator */}
            <div
              ref={indicatorRef}
              className="absolute top-1.5 h-[calc(100%-12px)] bg-background rounded-xl shadow-sm border border-border/50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />

            {menuTabs.map((tab) => {
              const TabIcon = tab.icon;
              const itemCount = tab.categories.reduce(
                (acc, cat) => acc + cat.items.length,
                0
              );
              return (
                <button
                  key={tab.value}
                  data-tab={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={cn(
                    "relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200",
                    activeTab === tab.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors duration-200",
                      activeTab === tab.value
                        ? "bg-primary/10 text-primary"
                        : "bg-transparent text-muted-foreground/60"
                    )}
                  >
                    {itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        {currentTab && (
          <div
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300",
              isTransitioning
                ? "opacity-0 translate-y-2"
                : "opacity-100 translate-y-0"
            )}
          >
            {currentTab.categories.map((category, i) => (
              <MenuCard
                key={category.title}
                title={category.title}
                subtitle={category.subtitle}
                description={category.description}
                icon={category.icon}
                gradient={category.gradient}
                emoji={category.emoji}
                image={category.image}
                items={category.items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  priceSmall: item.priceSmall,
                  description: item.description,
                }))}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Info note for Boissons */}
        {activeTab === "boissons" && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-sm text-muted-foreground border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Tous nos jus sont préparés avec des fruits frais. Prix en Francs CFA.
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
