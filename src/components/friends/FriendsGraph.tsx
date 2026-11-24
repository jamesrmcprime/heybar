"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type FriendPerson,
  displayName,
  personCaption,
} from "@/data/friends";
import styles from "@/app/friends/friends.module.css";
import { DiscoverRequestButton } from "./DiscoverRequestButton";
import { RequestActions } from "./RequestActions";

type FriendsGraphProps = {
  requests: FriendPerson[];
  buddies: FriendPerson[];
  discover: FriendPerson[];
};

function matchesQuery(person: FriendPerson, q: string): boolean {
  if (!q) return true;
  const hay = `${displayName(person)} ${personCaption(person)}`.toLowerCase();
  return hay.includes(q);
}

/**
 * Friends tab body — search + Requests / Buddies / Discover (People folded in).
 */
export function FriendsGraph({
  requests,
  buddies,
  discover,
}: FriendsGraphProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredRequests = useMemo(
    () => requests.filter((p) => matchesQuery(p, q)),
    [requests, q],
  );
  const filteredBuddies = useMemo(
    () => buddies.filter((p) => matchesQuery(p, q)),
    [buddies, q],
  );
  const filteredDiscover = useMemo(
    () => discover.filter((p) => matchesQuery(p, q)),
    [discover, q],
  );

  const empty =
    filteredRequests.length +
      filteredBuddies.length +
      filteredDiscover.length ===
    0;

  return (
    <>
      <label className={styles.search} htmlFor="friends-search">
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
        <input
          id="friends-search"
          type="search"
          className={styles.searchInput}
          placeholder="Find drinking buddies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>

      {empty ? (
        <p className="hb-caption">No people match “{query.trim()}”.</p>
      ) : null}

      <section aria-labelledby="friends-requests">
        <div className="hb-section-label">
          <h2 id="friends-requests" className="hb-h3">
            Requests
          </h2>
          <span className="hb-caption">
            {filteredRequests.length} pending
          </span>
        </div>
        {filteredRequests.map((person) => (
          <div key={person.id} className="hb-list-item">
            <Link
              href={`/friends/requests/${person.id}`}
              className={styles.rowLink}
            >
              <div className="hb-avatar">{person.initials}</div>
              <div className={styles.rowText}>
                <div className={styles.rowName}>{displayName(person)}</div>
                <div className="hb-caption">{personCaption(person)}</div>
              </div>
            </Link>
            <RequestActions personName={displayName(person)} />
          </div>
        ))}
        {filteredRequests.length === 0 && !empty ? (
          <p className="hb-caption">No pending requests in this filter.</p>
        ) : null}
      </section>

      <section aria-labelledby="friends-buddies">
        <div className="hb-section-label">
          <h2 id="friends-buddies" className="hb-h3">
            Buddies
          </h2>
          <span className="hb-caption">Invite to order</span>
        </div>
        {filteredBuddies.map((person) => (
          <div key={person.id} className="hb-list-item">
            <Link href={`/friends/${person.id}`} className={styles.rowLink}>
              <div className="hb-avatar">{person.initials}</div>
              <div className={styles.rowText}>
                <div className={styles.rowName}>{displayName(person)}</div>
                <div className="hb-caption">{personCaption(person)}</div>
              </div>
            </Link>
            <Link
              href={`/friends/invite/${person.id}`}
              className={`${styles.btnSm} ${styles.invite}`}
            >
              Add
            </Link>
          </div>
        ))}
      </section>

      <section aria-labelledby="friends-discover">
        <div className="hb-section-label">
          <h2 id="friends-discover" className="hb-h3">
            Discover
          </h2>
          <span className="hb-caption">People on HeyBar</span>
        </div>
        {filteredDiscover.map((person) => (
          <div key={person.id} className="hb-list-item">
            <Link href={`/friends/${person.id}`} className={styles.rowLink}>
              <div className="hb-avatar">{person.initials}</div>
              <div className={styles.rowText}>
                <div className={styles.rowName}>{displayName(person)}</div>
                <div className="hb-caption">{personCaption(person)}</div>
              </div>
            </Link>
            <DiscoverRequestButton personName={displayName(person)} />
          </div>
        ))}
      </section>
    </>
  );
}
