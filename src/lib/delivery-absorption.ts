/**
 * Shared-order delivery fee split + HeyBar absorption.
 * Rules: business-rules.md §2.3 / architecture.md §9.
 *
 * Equal split first, then each participant's membership delivery %
 * reduces only their own share. Unpaid gap is absorbed by HeyBar —
 * never redistributed to other participants.
 *
 * Delivery fee schedule / territory remain OPEN (seed fee for demos).
 * Product discounts are separate (own cart only) — not mixed here.
 *
 * Cent allocation keeps
 * participantsPayTotalZar + heyBarAbsorbsZar === deliveryFeeZar
 * for every participant count (DEF-SO-4).
 */

export type DeliveryParticipantInput = {
  /** Stable id for UI keys */
  id: string;
  /** Membership delivery discount 0–100 */
  deliveryDiscountPct: number;
};

export type DeliveryParticipantShare = {
  id: string;
  deliveryDiscountPct: number;
  /** Equal share before membership delivery discount */
  equalShareZar: number;
  /** Amount this participant pays toward delivery */
  participantPaysZar: number;
  /** Gap covered by HeyBar for this participant */
  absorbedZar: number;
};

export type DeliveryAbsorptionResult = {
  deliveryFeeZar: number;
  participantCount: number;
  /** Typical equal share (fee ÷ n, rounded) — per-row may differ by 1¢ */
  equalShareZar: number;
  participants: DeliveryParticipantShare[];
  /** Sum of absorbed gaps — HeyBar pays this */
  heyBarAbsorbsZar: number;
  /** Sum of participantPaysZar (what participants collectively pay) */
  participantsPayTotalZar: number;
};

/** Round to cents (ZAR) to avoid float drift in displays. */
export function roundZar(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function centsToZar(cents: number): number {
  return cents / 100;
}

/**
 * Compute equal delivery split + per-participant absorption.
 * Throws if participantCount < 1 or fee is negative.
 *
 * Equal shares are allocated in integer cents so they sum exactly to the
 * fee; each participant's pays + absorb equals their equal share.
 */
export function computeDeliveryAbsorption(
  deliveryFeeZar: number,
  participants: DeliveryParticipantInput[],
): DeliveryAbsorptionResult {
  if (deliveryFeeZar < 0) {
    throw new Error("deliveryFeeZar must be >= 0");
  }
  if (participants.length < 1) {
    throw new Error("shared order needs at least one participant");
  }

  const participantCount = participants.length;
  const feeCents = Math.round(deliveryFeeZar * 100);
  const baseCents = Math.floor(feeCents / participantCount);
  const remainderCents = feeCents - baseCents * participantCount;
  const equalShareZar = roundZar(deliveryFeeZar / participantCount);

  let payCentsTotal = 0;
  let absorbCentsTotal = 0;

  const shares: DeliveryParticipantShare[] = participants.map((p, index) => {
    const equalShareCents = baseCents + (index < remainderCents ? 1 : 0);
    const pct = clampPct(p.deliveryDiscountPct);
    const participantPaysCents = Math.round(
      equalShareCents * (1 - pct / 100),
    );
    const absorbedCents = equalShareCents - participantPaysCents;
    payCentsTotal += participantPaysCents;
    absorbCentsTotal += absorbedCents;
    return {
      id: p.id,
      deliveryDiscountPct: pct,
      equalShareZar: centsToZar(equalShareCents),
      participantPaysZar: centsToZar(participantPaysCents),
      absorbedZar: centsToZar(absorbedCents),
    };
  });

  return {
    deliveryFeeZar: centsToZar(feeCents),
    participantCount,
    equalShareZar,
    participants: shares,
    heyBarAbsorbsZar: centsToZar(absorbCentsTotal),
    participantsPayTotalZar: centsToZar(payCentsTotal),
  };
}

function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
}
