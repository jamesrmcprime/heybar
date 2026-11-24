import type { Metadata } from "next";
import { TopBar } from "@/components/drinker/TopBar";
import styles from "./friends.module.css";

export const metadata: Metadata = {
  title: "Friends",
};

const REQUESTS = [{ initials: "JM", name: "James McIntosh", note: "Wants to connect" }];

const BUDDIES = [
  { initials: "SL", name: "Sam Lady", note: "The Reserve · Sipper" },
  { initials: "DP", name: "Dave Person", note: "Neat · Taster" },
  { initials: "AK", name: "Alex K", note: "Straight Up · Taster" },
];

export default function FriendsPage() {
  return (
    <>
      <TopBar title="Friends" />
      <main className="hb-main">
        <div className={styles.search} role="search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <span>Find drinking buddies</span>
        </div>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Requests</h2>
            <span className="hb-caption">{REQUESTS.length} pending</span>
          </div>
          {REQUESTS.map((person) => (
            <div key={person.name} className="hb-list-item">
              <div className="hb-avatar">{person.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{person.name}</div>
                <div className="hb-caption">{person.note}</div>
              </div>
              <div className={styles.actions}>
                <button type="button" className={`${styles.btnSm} ${styles.accept}`}>
                  Accept
                </button>
                <button type="button" className={`${styles.btnSm} ${styles.ghost}`}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Buddies</h2>
            <span className="hb-caption">Invite to order</span>
          </div>
          {BUDDIES.map((person) => (
            <div key={person.name} className="hb-list-item">
              <div className="hb-avatar">{person.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{person.name}</div>
                <div className="hb-caption">{person.note}</div>
              </div>
              <button type="button" className={`${styles.btnSm} ${styles.invite}`}>
                Add
              </button>
            </div>
          ))}
        </section>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Discover</h2>
            <span className="hb-caption">People folded in</span>
          </div>
          <p className="hb-caption">
            Search and discovery shell — no live social graph yet.
          </p>
        </section>
      </main>
    </>
  );
}
