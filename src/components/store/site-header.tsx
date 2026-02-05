"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/use-scrolled";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "#menu", label: "Menu" },
  { href: "#galerie", label: "Galerie" },
  { href: "#avis", label: "Avis" },
];

export function SiteHeader() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "py-5"
      )}
    >
      <div className="container-site flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo />
          <span className="font-display text-xl font-semibold text-foreground">
            La Teranga
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-muted/60"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="ml-3 px-5 py-2.5 text-sm font-semibold bg-foreground text-background rounded-full transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
          >
            Commander
          </a>
          <ThemeToggle className="ml-2" />
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border">
          <nav className="container-site py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl transition-all hover:text-foreground hover:bg-muted/60"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-6 py-3 text-sm font-semibold bg-foreground text-background rounded-full text-center transition-all hover:opacity-90"
            >
              Commander
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
