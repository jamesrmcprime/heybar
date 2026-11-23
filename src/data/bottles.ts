/**
 * Prototype bottle catalogue seed (15 sealed bottles).
 * Prices from heybar-master-brief §7.5 — editable seed data, NOT live retail.
 * Do not import cocktails / custom drinks.
 */

export type BottleCategory =
  | "Gin"
  | "Rum"
  | "Vodka"
  | "Whiskey"
  | "Tequila"
  | "Wine"
  | "Beer"
  | "Brandy";

export type Bottle = {
  id: string;
  name: string;
  /** Editable prototype price in ZAR. */
  priceZar: number;
  sizeMl: number;
  abvPercent: number | null;
  category: BottleCategory;
  guild: BottleCategory;
  stock: number;
  available: boolean;
  description: string;
};

export const BOTTLE_SEED: Bottle[] = [
  {
    id: "bottle-absolut",
    name: "Absolut",
    priceZar: 20,
    sizeMl: 750,
    abvPercent: 40,
    category: "Vodka",
    guild: "Vodka",
    stock: 48,
    available: true,
    description: "Swedish vodka. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-bacardi-superior",
    name: "Bacardi Superior",
    priceZar: 22,
    sizeMl: 750,
    abvPercent: 37.5,
    category: "Rum",
    guild: "Rum",
    stock: 40,
    available: true,
    description: "White rum. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-bombay-sapphire",
    name: "Bombay Sapphire",
    priceZar: 32,
    sizeMl: 750,
    abvPercent: 47,
    category: "Gin",
    guild: "Gin",
    stock: 36,
    available: true,
    description: "London dry gin. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-captain-morgan-spiced",
    name: "Captain Morgan Spiced",
    priceZar: 20,
    sizeMl: 750,
    abvPercent: 35,
    category: "Rum",
    guild: "Rum",
    stock: 44,
    available: true,
    description: "Spiced rum. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-don-julio-blanco",
    name: "Don Julio Blanco",
    priceZar: 35,
    sizeMl: 750,
    abvPercent: 40,
    category: "Tequila",
    guild: "Tequila",
    stock: 24,
    available: true,
    description: "Blanco tequila. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-espolon-reposado",
    name: "Espolòn Reposado",
    priceZar: 30,
    sizeMl: 750,
    abvPercent: 40,
    category: "Tequila",
    guild: "Tequila",
    stock: 28,
    available: true,
    description: "Reposado tequila. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-glenfiddich-12",
    name: "Glenfiddich 12 Year",
    priceZar: 45,
    sizeMl: 750,
    abvPercent: 40,
    category: "Whiskey",
    guild: "Whiskey",
    stock: 20,
    available: true,
    description: "Single malt Scotch. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-grey-goose",
    name: "Grey Goose",
    priceZar: 40,
    sizeMl: 750,
    abvPercent: 40,
    category: "Vodka",
    guild: "Vodka",
    stock: 22,
    available: true,
    description: "French vodka. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-havana-club-3",
    name: "Havana Club 3 Year",
    priceZar: 23,
    sizeMl: 750,
    abvPercent: 40,
    category: "Rum",
    guild: "Rum",
    stock: 32,
    available: true,
    description: "Cuban rum. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-hendricks",
    name: "Hendrick's",
    priceZar: 35,
    sizeMl: 750,
    abvPercent: 41.4,
    category: "Gin",
    guild: "Gin",
    stock: 26,
    available: true,
    description: "Scottish gin. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-jack-daniels",
    name: "Jack Daniel's",
    priceZar: 30,
    sizeMl: 750,
    abvPercent: 40,
    category: "Whiskey",
    guild: "Whiskey",
    stock: 38,
    available: true,
    description: "Tennessee whiskey. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-jameson",
    name: "Jameson",
    priceZar: 25,
    sizeMl: 750,
    abvPercent: 40,
    category: "Whiskey",
    guild: "Whiskey",
    stock: 42,
    available: true,
    description: "Irish whiskey. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-patron-silver",
    name: "Patrón Silver",
    priceZar: 45,
    sizeMl: 750,
    abvPercent: 40,
    category: "Tequila",
    guild: "Tequila",
    stock: 18,
    available: true,
    description: "Silver tequila. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-smirnoff",
    name: "Smirnoff",
    priceZar: 15,
    sizeMl: 750,
    abvPercent: 37.5,
    category: "Vodka",
    guild: "Vodka",
    stock: 60,
    available: true,
    description: "Vodka. Sealed bottle — prototype seed.",
  },
  {
    id: "bottle-tanqueray",
    name: "Tanqueray",
    priceZar: 28,
    sizeMl: 750,
    abvPercent: 43.1,
    category: "Gin",
    guild: "Gin",
    stock: 34,
    available: true,
    description: "London dry gin. Sealed bottle — prototype seed.",
  },
];

export const BOTTLE_FILTERS = [
  "All",
  "Gin",
  "Whiskey",
  "Vodka",
  "Rum",
  "Tequila",
] as const;

export type BottleFilter = (typeof BOTTLE_FILTERS)[number];

export function listBottles(filter: BottleFilter = "All"): Bottle[] {
  if (filter === "All") return BOTTLE_SEED;
  return BOTTLE_SEED.filter((b) => b.category === filter);
}

export function getBottle(id: string): Bottle | undefined {
  return BOTTLE_SEED.find((b) => b.id === id);
}
