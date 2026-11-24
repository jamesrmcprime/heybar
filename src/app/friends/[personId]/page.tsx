import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import { DiscoverRequestButton } from "@/components/friends/DiscoverRequestButton";
import { MEMBERSHIP_TIERS } from "@/data/memberships";
import { RANKS } from "@/data/ranks";
import {
  allPeople,
  displayName,
  getPerson,
  personCaption,
} from "@/data/friends";
import styles from "./person.module.css";

type PageProps = {
  params: Promise<{ personId: string }>;
};

export function generateStaticParams() {
  return allPeople()
    .filter((p) => p.relation !== "incoming_request")
    .map((p) => ({ personId: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = getPerson(personId);
  return { title: person ? displayName(person) : "Friend" };
}

/**
 * Buddy / Discover person detail — config display only.
 * Incoming requests use /friends/requests/[requestId].
 */
export default async function FriendPersonPage({ params }: PageProps) {
  const { personId } = await params;
  const person = getPerson(personId);
  if (!person || person.relation === "incoming_request") notFound();

  const membership = MEMBERSHIP_TIERS.find((t) => t.id === person.membershipId);
  const rank = RANKS.find((r) => r.id === person.rankId);
  const name = displayName(person);
  const isBuddy = person.relation === "buddy";

  return (
    <>
      <StackHeader title="Friend" backHref="/friends" />
      <main className={`hb-main ${styles.main}`}>
        <div className={styles.hero}>
          <div className={styles.avatarLg} aria-hidden="true">
            {person.initials}
          </div>
          <h2 className="hb-h2" style={{ fontSize: 22 }}>
            {name}
          </h2>
          <p className="hb-caption">{personCaption(person)}</p>
        </div>

        <section className={styles.panel}>
          <div className={styles.kv}>
            <span>Relation</span>
            <span className={styles.v}>
              {isBuddy ? "Drinking buddy" : "Discover"}
            </span>
          </div>
          <div className={styles.kv}>
            <span>Membership</span>
            <span className={styles.v}>{membership?.name ?? "—"}</span>
          </div>
          <div className={styles.kv}>
            <span>Rank</span>
            <span className={styles.v}>{rank?.name ?? "—"}</span>
          </div>
        </section>

        <div className={styles.cta}>
          {isBuddy ? (
            <Link
              href={`/friends/invite/${person.id}`}
              className={styles.primary}
            >
              Invite to shared order
            </Link>
          ) : (
            <DiscoverRequestButton personName={name} size="lg" />
          )}
          <Link href="/friends" className={styles.secondary}>
            Back to Friends
          </Link>
        </div>

        <p className="hb-caption">
          No Bottle Top / XP rules here · invite shell does not run delivery
          absorption math
        </p>
      </main>
    </>
  );
}
