import { BrandLogo } from "@/components/store/brand-logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="md" />
          <span className="font-display text-2xl font-bold">La Teranga</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-background p-8 shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
}
