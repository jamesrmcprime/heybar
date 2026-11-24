"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Home",
    match: (path: string) => path === "/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5V21H14V14H10v7H3z" />
      </svg>
    ),
  },
  {
    href: "/bottles",
    label: "Bottles",
    match: (path: string) => path.startsWith("/bottles"),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6v3H9z" />
        <path d="M8 6h8l1 14H7L8 6z" />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Friends",
    match: (path: string) => path.startsWith("/friends"),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M4 21v-1a6 6 0 0 1 16 0v1" />
        <path d="M19 8a3 3 0 0 1 0 6" />
      </svg>
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    match: (path: string) => path.startsWith("/orders"),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h13v12H7z" />
        <path d="M4 4h13v3" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    match: (path: string) =>
      path.startsWith("/profile") ||
      path.startsWith("/account") ||
      path.startsWith("/guild") ||
      path.startsWith("/rewards"),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="hb-tabbar" aria-label="Drinker">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="hb-tab"
            aria-current={active ? "page" : undefined}
          >
            {tab.icon}
            {tab.label}
            <span className="hb-tab__dot" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
