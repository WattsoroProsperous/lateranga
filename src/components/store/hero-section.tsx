"use client";

import Image from "next/image";
import { BookOpen, MapPin, Star, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { Container } from "@/components/shared/container";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary via-background to-background" />
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            {/* Location Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-8">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Treichville, Abidjan
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] mb-6 text-foreground tracking-tight">
              L&apos;authentique cuisine{" "}
              <span className="text-gradient-primary">sénégalaise</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed mx-auto lg:mx-0">
              Découvrez les saveurs du Sénégal avec nos Tchep, Yassa et autres
              spécialités préparées avec passion.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
              <a
                href="#menu"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4" />
                Voir le menu
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-foreground border border-border rounded-full transition-all duration-300 hover:bg-foreground hover:text-background hover:border-foreground"
              >
                Nous contacter
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-border justify-center lg:justify-start">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1 justify-center lg:justify-start">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-display text-2xl font-bold text-foreground">4.0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Note Google</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="font-display text-2xl font-bold text-foreground">1290+</div>
                <div className="text-xs text-muted-foreground mt-0.5">Avis clients</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="font-display text-2xl font-bold text-foreground">10+</div>
                <div className="text-xs text-muted-foreground mt-0.5">Années</div>
              </div>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] max-w-md mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/images/hero.jpg"
                alt="Plat sénégalais La Teranga"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Subtle overlay gradient at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 left-4 sm:left-8 lg:-left-4 bg-card px-4 py-3 rounded-2xl shadow-lg border border-border flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg">
                🍛
              </div>
              <div>
                <span className="block text-sm font-semibold text-foreground">
                  Sur place & Livraison
                </span>
                <span className="text-xs text-muted-foreground">
                  Commandez maintenant
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
      </motion.div>
    </section>
  );
}
