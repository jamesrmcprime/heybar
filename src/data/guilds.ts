/**
 * Eight Guilds from Airtable / developer report.
 * Names & focus only — no invent earn/claim rules.
 */

export type Guild = {
  id: string;
  name: string;
  focus: string;
  /** CSS accent key for stand-in badge art */
  accent: "gin" | "rum" | "wine" | "tequila" | "beer" | "whiskey" | "brandy" | "vodka";
};

export const GUILDS: Guild[] = [
  { id: "gin", name: "Gin Connoisseurs", focus: "Gin", accent: "gin" },
  { id: "rum", name: "Rum Raiders", focus: "Rum", accent: "rum" },
  { id: "wine", name: "Wine Enthusiasts", focus: "Wine", accent: "wine" },
  { id: "tequila", name: "Tequila Trailblazers", focus: "Tequila", accent: "tequila" },
  { id: "beer", name: "Beer Brewers", focus: "Beer", accent: "beer" },
  { id: "whiskey", name: "Whiskey Wanderers", focus: "Whiskey", accent: "whiskey" },
  { id: "brandy", name: "Brandy Society", focus: "Brandy", accent: "brandy" },
  { id: "vodka", name: "Vodka Virtuosos", focus: "Vodka", accent: "vodka" },
];
