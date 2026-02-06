import { MapPin, Phone, Clock, UtensilsCrossed } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeader } from "./section-header";
import { ContactItem } from "./contact-item";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="py-20 md:py-28 px-4 sm:px-6 bg-neutral-900 dark:bg-neutral-950 text-neutral-100"
    >
      <Container>
        <SectionHeader
          tag="Contact"
          title="Venez nous voir"
          description="Nous vous accueillons dans notre restaurant à Treichville."
          dark
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden min-h-[400px] border border-white/10">
            <iframe
              src="https://maps.google.com/maps?q=LA+TERANGA+Treichville+Abidjan&t=&z=17&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[400px] border-0 grayscale contrast-110"
              allowFullScreen
              loading="lazy"
              title="La Teranga - Localisation"
            />
          </div>

          {/* Contact Card */}
          <div className="bg-white/5 border border-white/10 p-8 sm:p-10 rounded-2xl">
            <h3 className="font-display text-2xl font-bold text-neutral-100 mb-2">
              Informations
            </h3>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
              Restaurant africain sénégalais — Cuisine authentique depuis des
              années.
            </p>

            <div className="space-y-1">
              <ContactItem
                icon={MapPin}
                label="Adresse"
                value="8X4M+PRJ, Treichville, Abidjan"
              />
              <ContactItem
                icon={Phone}
                label="Téléphone"
                value="27 21 24 02 28"
              />
              <ContactItem
                icon={Clock}
                label="Horaires"
                value={
                  <>
                    <span className="text-emerald-400">Ouvert</span> — Ferme à
                    17:00
                  </>
                }
              />
              <ContactItem
                icon={UtensilsCrossed}
                label="Services"
                value="Sur place, Emporter, Livraison"
              />
            </div>

            <div className="mt-8">
              <a
                href="tel:+2252721240228"
                className="flex items-center justify-center gap-2.5 w-full px-6 py-3.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <Phone className="w-4 h-4" />
                Appeler pour réserver
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
