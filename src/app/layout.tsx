import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/drinker/AppShell";
import "./globals.css";

/**
 * Self-hosted woff2 (src/fonts/) — avoids next/font/google network fetch
 * during `next build` (flaky on CI runners when fonts.google.com is slow/blocked).
 */
const syne = localFont({
  src: [
    { path: "../fonts/syne-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/syne-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-syne",
  display: "swap",
});

const manrope = localFont({
  src: [
    { path: "../fonts/manrope-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/manrope-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/manrope-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-mono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HeyBar",
    template: "%s · HeyBar",
  },
  description: "Sealed bottles. Shared orders. Night delivered.",
  applicationName: "HeyBar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HeyBar",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0908",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-ZA"
      className={`${syne.variable} ${manrope.variable} ${plexMono.variable}`}
    >
      <body
        style={
          {
            ["--hb-font-display" as string]: "var(--font-syne), system-ui, sans-serif",
            ["--hb-font-body" as string]: "var(--font-manrope), system-ui, sans-serif",
            ["--hb-font-mono" as string]:
              "var(--font-plex-mono), ui-monospace, monospace",
          } as React.CSSProperties
        }
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
