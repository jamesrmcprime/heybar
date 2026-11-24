import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import { InviteConfirm } from "@/components/orders/InviteConfirm";
import {
  buddies,
  displayName,
  getPerson,
  personCaption,
} from "@/data/friends";
import { MEMBERSHIP_TIERS } from "@/data/memberships";
import { resolveOrder, sharedActiveOrders } from "@/data/orders";
import { computeDeliveryAbsorption } from "@/lib/delivery-absorption";
import { formatZar } from "@/lib/format";
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
 * Invite buddy into an active shared order.
 * Shows delivery-absorption preview if they joined (equal split recalculated).
 * Confirm is local UI only — not persisted.
 */
export default async function InviteFriendPage({ params }: PageProps) {
  const { personId } = await params;
  const person = getPerson(personId);
  if (!person || person.relation !== "buddy") notFound();

  const name = displayName(person);
  const tier = MEMBERSHIP_TIERS.find((t) => t.id === person.membershipId)!;
  const shared = sharedActiveOrders();
  const target = shared[0];
  const alreadyOn =
    target?.participants.some((p) => p.personKey === person.id) ?? false;

  let preview: {
    equalShareZar: number;
    participantPaysZar: number;
    absorbedZar: number;
    heyBarAbsorbsZar: number;
    participantCount: number;
    deliveryFeeZar: number;
  } | null = null;

  if (target && !alreadyOn) {
    const resolved = resolveOrder(target);
    const nextInputs = [
      ...resolved.participants.map((p) => ({
        id: p.id,
        deliveryDiscountPct: p.deliveryDiscountPct,
      })),
      {
        id: `invite-${person.id}`,
        deliveryDiscountPct: tier.deliveryDiscountPct,
      },
    ];
    const absorption = computeDeliveryAbsorption(
      target.deliveryFeeZar,
      nextInputs,
    );
    const inviteShare = absorption.participants.find(
      (p) => p.id === `invite-${person.id}`,
    )!;
    preview = {
      equalShareZar: absorption.equalShareZar,
      participantPaysZar: inviteShare.participantPaysZar,
      absorbedZar: inviteShare.absorbedZar,
      heyBarAbsorbsZar: absorption.heyBarAbsorbsZar,
      participantCount: absorption.participantCount,
      deliveryFeeZar: absorption.deliveryFeeZar,
    };
  }

  return (
    <>
      <StackHeader title="Invite" backHref={`/friends/${person.id}`} />
      <main className={`hb-main ${styles.main}`}>
        <p className="hb-caption">
          Add buddy to a shared order · sealed bottles only
        </p>

        <section className={styles.panel}>
          <div className={styles.buddy}>
            <div className="hb-avatar">{person.initials}</div>
            <div>
              <div className={styles.name}>{name}</div>
              <div className="hb-caption">{personCaption(person)}</div>
            </div>
          </div>

          {target ? (
            <>
              <div className={styles.orderTarget}>
                <div className="hb-caption">Shared order</div>
                <div className={styles.name}>{target.title}</div>
                <div className={styles.orderId}>{target.id}</div>
                <Link href={`/orders/${target.id}`} className={styles.orderLink}>
                  Open order room
                </Link>
              </div>

              {alreadyOn ? (
                <p className={styles.openFlag}>
                  Already on this shared order · pick another buddy
                </p>
              ) : preview ? (
                <div className={styles.preview}>
                  <div className="hb-caption">
                    If {name} joins · delivery recalculated
                  </div>
                  <p className={styles.previewLine}>
                    Fee {formatZar(preview.deliveryFeeZar)} ÷{" "}
                    {preview.participantCount} ={" "}
                    {formatZar(preview.equalShareZar)} each before membership %
                  </p>
                  <p className={styles.previewLine}>
                    {name} ({tier.name}, {tier.deliveryDiscountPct}% delivery)
                    pays {formatZar(preview.participantPaysZar)}
                    {preview.absorbedZar > 0
                      ? ` · HeyBar absorbs ${formatZar(preview.absorbedZar)}`
                      : ""}
                  </p>
                  <p className={styles.previewLine}>
                    Total HeyBar absorbs → {formatZar(preview.heyBarAbsorbsZar)}
                  </p>
                  <p className="hb-caption">
                    Unpaid gap is not redistributed to other participants.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className={styles.openFlag}>
              No active shared order · create one from Orders (shell next)
            </p>
          )}
        </section>

        <div className={styles.cta}>
          {target && !alreadyOn ? (
            <InviteConfirm personName={name} orderTitle={target.title} />
          ) : (
            <button type="button" className={styles.primary} disabled>
              Confirm invite (disabled)
            </button>
          )}
          <Link
            href={target ? `/orders/${target.id}` : "/orders"}
            className={styles.secondary}
          >
            {target ? "View shared order" : "View Orders"}
          </Link>
          <Link href="/friends" className={styles.secondary}>
            Back to Friends
          </Link>
        </div>
      </main>
    </>
  );
}
