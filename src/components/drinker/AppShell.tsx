"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "./TabBar";

type AppShellProps = {
  children: React.ReactNode;
};

/** Secondary flows — no drinker tab bar (matches wave-2 mockups). */
function isFlowRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/age-gate") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile/fields")
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const flow = isFlowRoute(pathname);

  return (
    <div className={`hb-app hb-canvas${flow ? " hb-app--flow" : ""}`}>
      {children}
      {flow ? null : <TabBar />}
    </div>
  );
}
