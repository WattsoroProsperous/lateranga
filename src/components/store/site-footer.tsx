import Link from "next/link";
import { Facebook, Instagram, Phone, MapPin } from "lucide-react";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-100">
      <div className="container-site py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo size="sm" />
              <span className="font-display text-lg font-semibold text-neutral-100">
                La Teranga
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              Restaurant sénégalais authentique à Treichville, Abidjan.
              Cuisine préparée avec passion depuis plus de 10 ans.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-100 mb-4 uppercase tracking-wider">
              Navigation
            </h4>
            <nav className="flex flex-col gap-2.5">
              <a href="#menu" className="text-sm text-neutral-400 transition-colors hover:text-neutral-100">
                Notre carte
              </a>
              <a href="#galerie" className="text-sm text-neutral-400 transition-colors hover:text-neutral-100">
                Galerie photos
              </a>
              <a href="#avis" className="text-sm text-neutral-400 transition-colors hover:text-neutral-100">
                Avis clients
              </a>
              <a href="#contact" className="text-sm text-neutral-400 transition-colors hover:text-neutral-100">
                Contact
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-100 mb-4 uppercase tracking-wider">
              Contact
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Treichville, Abidjan
              </div>
              <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                27 21 24 02 28
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Link
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-neutral-400 transition-all hover:bg-primary hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-neutral-400 transition-all hover:bg-primary hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} La Teranga — Restaurant Africain Abidjan. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
