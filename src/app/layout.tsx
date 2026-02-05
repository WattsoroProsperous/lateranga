import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "La Teranga — Restaurant Africain Abidjan",
  description:
    "La Teranga — Restaurant africain sénégalais à Treichville, Abidjan. Cuisine sénégalaise authentique, Tchep, Yassa, ambiance conviviale.",
  keywords: [
    "restaurant",
    "africain",
    "sénégalais",
    "Abidjan",
    "Treichville",
    "Tchep",
    "Yassa",
    "La Teranga",
  ],
  openGraph: {
    title: "La Teranga — Restaurant Africain Abidjan",
    description:
      "Cuisine sénégalaise authentique à Treichville, Abidjan. Tchep, Yassa et spécialités.",
    locale: "fr_CI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
