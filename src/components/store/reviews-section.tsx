import { Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeader } from "./section-header";
import { ReviewCard } from "./review-card";

const reviews = [
  {
    stars: 5,
    text: "Cuisine très excellente. Personnel très accueillant avec une mention spéciale à Miss Anita.",
    authorName: "Francky KITOKO",
    authorInitials: "FK",
    date: "Il y a 4 mois",
    badge: "Local Guide",
  },
  {
    stars: 5,
    text: "Un lieu convivial où l'on découvre ce qui fait la renommée du Sénégal. Tchep blanc, rouge, au mouton, poulet... Tout est délicieux !",
    authorName: "Rafiou OYEOSSI",
    authorInitials: "RO",
    date: "Il y a un an",
    badge: "Local Guide",
  },
  {
    stars: 5,
    text: "Franchement bon. Tchep blanc ou rouge, poisson ou mouton, yassa poulet, sauce arachide. Pas de mauvais choix. L'endroit est grand et l'assiette arrive rapidement.",
    authorName: "JP LH",
    authorInitials: "JP",
    date: "Il y a 3 ans",
    badge: "Local Guide",
  },
];

export function ReviewsSection() {
  return (
    <section id="avis" className="py-20 md:py-28 px-4 sm:px-6 bg-background">
      <Container>
        <SectionHeader
          tag="Avis Clients"
          title="Ce que disent nos clients"
          description="Plus de 1 290 avis positifs de nos fidèles clients."
        />

        {/* Overall Score */}
        <div className="flex items-center justify-center gap-5 mb-14">
          <div className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-2xl bg-muted/50 border border-border">
            <span className="font-display text-5xl font-bold text-foreground">4,0</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
              <Star className="w-4 h-4 fill-amber-500/20 text-amber-500/20" />
            </div>
            <p className="text-xs text-muted-foreground">
              1 292 avis Google
            </p>
          </div>
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <ReviewCard key={review.authorInitials} {...review} />
          ))}
        </div>
      </Container>
    </section>
  );
}
