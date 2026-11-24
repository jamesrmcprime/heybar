import type { ReactNode } from "react";
import type { Guild } from "@/data/guilds";

const ICONS: Record<Guild["accent"], ReactNode> = {
  gin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9ed4b4" strokeWidth="1.6">
      <path d="M8 3h8l-1 4H9L8 3z" />
      <path d="M9 7h6l1 14H8L9 7z" />
      <path d="M7 11c2 1 3 3 5 3s3-2 5-3" />
    </svg>
  ),
  rum: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#e09a3e" strokeWidth="1.6">
      <path d="M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" />
      <path d="M9 8V5h6v3" />
      <path d="M8 12h8" />
    </svg>
  ),
  wine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#d48aa0" strokeWidth="1.6">
      <path d="M8 4h8l-1 7a4 4 0 0 1-6 0L8 4z" />
      <path d="M12 11v7" />
      <path d="M9 20h6" />
    </svg>
  ),
  tequila: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.6">
      <path d="M10 3h4v4l2 3v9H8V10l2-3V3z" />
      <path d="M8 14h8" />
    </svg>
  ),
  beer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#e09a3e" strokeWidth="1.6">
      <path d="M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z" />
      <path d="M16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
      <path d="M8 5c1 1 2 2 4 2s3-1 4-2" />
    </svg>
  ),
  whiskey: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#c4894a" strokeWidth="1.6">
      <path d="M8 5h8v4l-1 12H9L8 9V5z" />
      <path d="M8 10h8" />
      <circle cx="12" cy="15" r="1.5" />
    </svg>
  ),
  brandy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#e85d3b" strokeWidth="1.6">
      <path d="M9 3h6v3l2 4v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l2-4V3z" />
      <path d="M8 12h8" />
    </svg>
  ),
  vodka: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7eb7d4" strokeWidth="1.6">
      <path d="M10 2h4v5l2 4v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V11l2-4V2z" />
      <path d="M9 13h6" />
    </svg>
  ),
};

type GuildBadgeProps = {
  accent: Guild["accent"];
  size?: "md" | "lg";
};

export function GuildBadge({ accent, size = "md" }: GuildBadgeProps) {
  const sizeClass = size === "lg" ? " hb-gbadge--lg" : "";
  return (
    <div
      className={`hb-gbadge hb-gbadge--${accent}${sizeClass}`}
      aria-hidden="true"
    >
      {ICONS[accent]}
    </div>
  );
}
