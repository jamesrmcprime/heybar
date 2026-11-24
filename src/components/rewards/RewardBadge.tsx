import type { RewardState } from "@/data/rewards";

type RewardBadgeProps = {
  code: string;
  level: number;
  state?: RewardState;
  size?: "md" | "xl";
};

export function RewardBadge({
  code,
  level,
  state = "active",
  size = "md",
}: RewardBadgeProps) {
  const stateClass =
    state === "earned"
      ? " hb-rbadge--earned"
      : state === "locked"
        ? " hb-rbadge--locked"
        : "";
  const sizeClass = size === "xl" ? " hb-rbadge--xl" : "";

  return (
    <div
      className={`hb-rbadge${stateClass}${sizeClass}`}
      aria-hidden="true"
    >
      {code}
      <span className="hb-rbadge__lvl">L{level}</span>
    </div>
  );
}
