import Image from "next/image";
import { cn } from "@/lib/utils";

interface GalleryItemProps {
  src: string;
  alt: string;
  large?: boolean;
}

export function GalleryItem({ src, alt, large }: GalleryItemProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden cursor-pointer",
        large && "col-span-2 row-span-2"
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        sizes={large ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
        <p className="text-white text-sm font-medium p-4">{alt}</p>
      </div>
    </div>
  );
}
