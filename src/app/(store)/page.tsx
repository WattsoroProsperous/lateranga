import { HeroSection } from "@/components/store/hero-section";
import { MenuSection } from "@/components/store/menu-section";
import { GallerySection } from "@/components/store/gallery-section";
import { ReviewsSection } from "@/components/store/reviews-section";
import { ContactSection } from "@/components/store/contact-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MenuSection />
      <GallerySection />
      <ReviewsSection />
      <ContactSection />
    </>
  );
}
