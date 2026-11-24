import type { Metadata } from "next";
import { BottleCatalogue } from "@/components/drinker/BottleCatalogue";
import { TopBar } from "@/components/drinker/TopBar";

export const metadata: Metadata = {
  title: "Bottles",
};

export default function BottlesPage() {
  return (
    <>
      <TopBar title="Bottles" cartBadge />
      <main className="hb-main">
        <BottleCatalogue />
      </main>
    </>
  );
}
