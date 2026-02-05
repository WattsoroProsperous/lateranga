/**
 * Static menu data - used as fallback when Supabase is not configured.
 * All 51 items from the original La Teranga menu.
 */

import type { LucideIcon } from "lucide-react";
import {
  Fish,
  Flame,
  UtensilsCrossed,
  Clock,
  IceCream,
  Citrus,
  Coffee,
  Leaf,
} from "lucide-react";

export interface StaticMenuItem {
  id: string;
  name: string;
  price: number;
  priceSmall?: number;
  description?: string;
}

export interface StaticMenuCategory {
  title: string;
  subtitle?: string;
  description?: string;
  icon: LucideIcon;
  gradient: string;
  emoji: string;
  image: string;
  items: StaticMenuItem[];
}

export interface StaticMenuTab {
  label: string;
  value: string;
  icon: LucideIcon;
  categories: StaticMenuCategory[];
}

export const menuTabs: StaticMenuTab[] = [
  {
    label: "Les Plats",
    value: "plats",
    icon: UtensilsCrossed,
    categories: [
      {
        title: "Nos Tchieps",
        icon: Fish,
        gradient: "from-amber-500 to-orange-600",
        emoji: "\ud83c\udf5b",
        image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "t1", name: "Tcheip au poisson", price: 5000 },
          { id: "t2", name: "Tcheip au poulet", price: 5000 },
          { id: "t3", name: "Tcheip au mouton", price: 5000 },
          { id: "t4", name: "Tcheip mechoui", price: 6000 },
          { id: "t5", name: "Tcheip Teranga", price: 6000, description: "Notre sp\u00e9cialit\u00e9 maison" },
        ],
      },
      {
        title: "Nos Grillardes",
        icon: Flame,
        gradient: "from-red-500 to-orange-500",
        emoji: "\ud83d\udd25",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "g1", name: "Poulet pan\u00e9", price: 6000 },
          { id: "g2", name: "Poissons brais\u00e9s", price: 6000 },
          { id: "g3", name: "Poulet brais\u00e9", price: 6000 },
          { id: "g4", name: "Brochette de filet", price: 6000 },
          { id: "g5", name: "Salade de poulet", price: 6000 },
          { id: "g6", name: "Crudit\u00e9 simple", price: 4000 },
          { id: "g7", name: "Frite au poulet", price: 6000 },
          { id: "g8", name: "Saut\u00e9 de Gambas", price: 6000 },
          { id: "g9", name: "Roulade de filet", price: 6000 },
          { id: "g10", name: "Blanc de poulet au jambon", price: 6000 },
          { id: "g11", name: "Poisson frite", price: 7000 },
        ],
      },
      {
        title: "Menu G\u00e9n\u00e9ral",
        icon: UtensilsCrossed,
        gradient: "from-blue-500 to-cyan-500",
        emoji: "\ud83c\udf72",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "m1", name: "Gouagouassou", price: 5000 },
          { id: "m2", name: "Soupe de poisson", price: 5000 },
          { id: "m3", name: "Soupe de mouton", price: 6000 },
          { id: "m4", name: "K\u00e9djenou de poulet", price: 5000 },
          { id: "m5", name: "K\u00e9djenou de pintade", price: 6000 },
          { id: "m6", name: "Yassa poulet", price: 5000 },
          { id: "m7", name: "Yassa mouton", price: 6000 },
          { id: "m8", name: "Couscous poulet", price: 5000 },
          { id: "m9", name: "Couscous mouton", price: 6000 },
          { id: "m10", name: "Blanc de poulet au jambon", price: 7000 },
          { id: "m11", name: "Poisson frite", price: 7000 },
        ],
      },
      {
        title: "Menus sur Commande",
        icon: Clock,
        gradient: "from-teal-500 to-emerald-500",
        emoji: "\ud83d\udccb",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "c1", name: "Brochette de Filet", price: 6000 },
          { id: "c2", name: "Brochette de poulet", price: 6000 },
          { id: "c3", name: "Saut\u00e9 de gambas au riz", price: 6000 },
          { id: "c4", name: "Mechoui", price: 6000 },
          { id: "c5", name: "Poulet brais\u00e9", price: 6000 },
          { id: "c6", name: "Poisson brais\u00e9 / Frite", price: 6000 },
          { id: "c7", name: "Saut\u00e9 de gambas au frite", price: 6000 },
        ],
      },
    ],
  },
  {
    label: "Desserts",
    value: "desserts",
    icon: IceCream,
    categories: [
      {
        title: "Nos Desserts",
        icon: IceCream,
        gradient: "from-pink-500 to-rose-500",
        emoji: "\ud83c\udf68",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "d1", name: "Salade de fruit", price: 1000 },
          { id: "d2", name: "Cocktail de fruit", price: 2000 },
        ],
      },
    ],
  },
  {
    label: "Boissons",
    value: "boissons",
    icon: Coffee,
    categories: [
      {
        title: "Jus Naturels",
        subtitle: "Petit / Grand Format",
        icon: Citrus,
        gradient: "from-green-500 to-lime-500",
        emoji: "\ud83e\uddc3",
        image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "j1", name: "Jus de Gingembre", price: 2000, priceSmall: 500 },
          { id: "j2", name: "Jus de Passion", price: 2000, priceSmall: 500 },
          { id: "j3", name: "Jus de Baobab", price: 2000, priceSmall: 500 },
          { id: "j4", name: "Jus de Tamarin", price: 2000, priceSmall: 500 },
          { id: "j5", name: "Jus de Citron", price: 2000, priceSmall: 500 },
          { id: "j6", name: "Jus de Bissap", price: 2000, priceSmall: 500 },
          { id: "j7", name: "Cocktail de jus de fruit", price: 2000, priceSmall: 500 },
          { id: "j8", name: "Jus d'orange (nature)", price: 1000 },
          { id: "j9", name: "Jus d'ananas", price: 1000 },
        ],
      },
      {
        title: "Autres Boissons",
        icon: Coffee,
        gradient: "from-amber-500 to-yellow-500",
        emoji: "\u2615",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          { id: "b1", name: "Eau Min\u00e9rale (petite)", price: 500 },
          { id: "b2", name: "Eau Min\u00e9rale (grande)", price: 1000 },
          { id: "b3", name: "Sucrerie", price: 500 },
          { id: "b4", name: "Petit caf\u00e9", price: 1000 },
          { id: "b5", name: "Th\u00e9", price: 500 },
        ],
      },
      {
        title: "Th\u00e9 Ataya",
        description: "Le c\u00e9l\u00e8bre th\u00e9 s\u00e9n\u00e9galais \u00e0 la menthe",
        icon: Leaf,
        gradient: "from-emerald-500 to-green-600",
        emoji: "\ud83c\udf75",
        image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&h=500&fit=crop&auto=format&q=80",
        items: [
          {
            id: "b6",
            name: "Th\u00e9 Ataya \u00e0 la Menthe Fra\u00eeche",
            price: 500,
            description: "Pr\u00e9paration traditionnelle",
          },
        ],
      },
    ],
  },
];
