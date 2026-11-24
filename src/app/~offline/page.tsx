import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="hb-main" style={{ justifyContent: "center", gap: 12 }}>
      <h1 className="hb-h1">You&apos;re offline</h1>
      <p className="hb-muted">
        HeyBar needs a connection for orders and catalogue updates. Cached shell
        only.
      </p>
    </main>
  );
}
