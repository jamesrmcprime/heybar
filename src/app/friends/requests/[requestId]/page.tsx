import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import { RequestActions } from "@/components/friends/RequestActions";
import { MEMBERSHIP_TIERS } from "@/data/memberships";
import { RANKS } from "@/data/ranks";
import {
  displayName,
  getPerson,
  incomingRequests,
} from "@/data/friends";
import styles from "./request.module.css";
import friendStyles from "../../friends.module.css";

type PageProps = {
  params: Promise<{ requestId: string }>;
};

export function generateStaticParams() {
  return incomingRequests().map((p) => ({ requestId: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { requestId } = await params;
  const person = getPerson(requestId);
  return { title: person ? `Request · ${displayName(person)}` : "Request" };
}

/**
 * Friend request detail — Accept / Decline shell only.
 */
export default async function FriendRequestPage({ params }: PageProps) {
  const { requestId } = await params;
  const person = getPerson(requestId);
  if (!person || person.relation !== "incoming_request") notFound();

  const membership = MEMBERSHIP_TIERS.find((t) => t.id === person.membershipId);
  const rank = RANKS.find((r) => r.id === person.rankId);
  const name = displayName(person);

  return (
    <>
      <StackHeader title="Request" backHref="/friends" />
      <main className={`hb-main ${styles.main}`}>
        <div className={styles.hero}>
          <div className={styles.avatarLg} aria-hidden="true">
            {person.initials}
          </div>
          <h2 className="hb-h2" style={{ fontSize: 22 }}>
            {name}
          </h2>
          <p className="hb-caption">
            {person.note ?? "Wants to connect"}
          </p>
        </div>

        <section className={styles.panel}>
          <p className="hb-caption" style={{ marginBottom: 8 }}>
            {membership?.name ?? "Member"}
            {rank ? ` · ${rank.name}` : ""}
          </p>
          <p className="hb-caption">
            Accepting adds a drinking buddy in the live app. This shell does not
            persist graph changes.
          </p>
        </section>

        <div className={`${styles.actionsWrap} ${friendStyles.actionsStack}`}>
          <RequestActions personName={name} layout="stack" />
        </div>
      </main>
    </>
  );
}
