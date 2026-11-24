import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import { AppShell } from "@/components/drinker/AppShell";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
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
