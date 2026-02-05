import { Container } from "@/components/shared/container";
import { SectionHeader } from "./section-header";
import { GalleryItem } from "./gallery-item";

const galleryImages = [
  { src: "/images/gallery-1.jpg", alt: "Restaurant La Teranga", large: true },
  { src: "/images/gallery-2.jpg", alt: "Tchep sénégalais" },
  { src: "/images/gallery-3.jpg", alt: "Ambiance chaleureuse" },
  { src: "/images/gallery-4.jpg", alt: "Nos plats signature" },
  { src: "/images/gallery-5.png", alt: "Cuisine authentique" },
];

export function GallerySection() {
  return (
    <section
      id="galerie"
      className="py-20 md:py-28 px-4 sm:px-6 bg-secondary"
    >
      <Container>
        <SectionHeader
          tag="Galerie Photos"
          title="Notre Univers"
          description="Plongez dans l'atmosphère chaleureuse de La Teranga à Treichville."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[160px] sm:auto-rows-[180px] lg:auto-rows-[200px] gap-3 sm:gap-4">
          {galleryImages.map((img) => (
            <GalleryItem key={img.src} {...img} />
          ))}
        </div>
      </Container>
    </section>
  );
}
