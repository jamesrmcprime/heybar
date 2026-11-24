import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import {
  buddies,
  displayName,
  getPerson,
  personCaption,
} from "@/data/friends";
import styles from "./invite.module.css";

type PageProps = {
  params: Promise<{ personId: string }>;
};

export function generateStaticParams() {
  return buddies().map((p) => ({ personId: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = getPerson(personId);
  return {
    title: person ? `Invite · ${displayName(person)}` : "Invite",
  };
}

/**
 * Invite-to-shared-order shell.
 * Does not invent delivery absorption, payment split, or XP rules.
 * Shared-order math lands in the next Day 2 slice.
 */
export default async function InviteFriendPage({ params }: PageProps) {
  const { personId } = await params;
  const person = getPerson(personId);
  if (!person || person.relation !== "buddy") notFound();

  const name = displayName(person);

  return (
    <>
      <StackHeader title="Invite" backHref={`/friends/${person.id}`} />
      <main className={`hb-main ${styles.main}`}>
        <p className="hb-caption">Add buddy to a shared order · shell only</p>

        <section className={styles.panel}>
          <div className={styles.buddy}>
            <div className="hb-avatar">{person.initials}</div>
            <div>
              <div className={styles.name}>{name}</div>
              <div className="hb-caption">{personCaption(person)}</div>
            </div>
          </div>
          <p className="hb-caption">
            Sealed bottles only. Per-person carts, delivery split, and HeyBar
            absorption stay server-side in the shared-orders slice — not invented
            here.
          </p>
          <p className={styles.openFlag}>
            Shared-order invite · OPEN until next PR
          </p>
        </section>

        <div className={styles.cta}>
          <button type="button" className={styles.primary} disabled>
            Confirm invite (disabled)
          </button>
          <Link href="/orders" className={styles.secondary}>
            View Orders shell
          </Link>
          <Link href="/friends" className={styles.secondary}>
            Back to Friends
          </Link>
        </div>
      </main>
    </>
  );
}
