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

/**
 * Compute equal delivery split + per-participant absorption.
 * Throws if participantCount < 1 or fee is negative.
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
  const equalShareZar = roundZar(deliveryFeeZar / participantCount);

  const shares: DeliveryParticipantShare[] = participants.map((p) => {
    const pct = clampPct(p.deliveryDiscountPct);
    const participantPaysZar = roundZar(equalShareZar * (1 - pct / 100));
    const absorbedZar = roundZar(equalShareZar - participantPaysZar);
    return {
      id: p.id,
      deliveryDiscountPct: pct,
      equalShareZar,
      participantPaysZar,
      absorbedZar,
    };
  });

  const heyBarAbsorbsZar = roundZar(
    shares.reduce((sum, s) => sum + s.absorbedZar, 0),
  );
  const participantsPayTotalZar = roundZar(
    shares.reduce((sum, s) => sum + s.participantPaysZar, 0),
  );

  return {
    deliveryFeeZar: roundZar(deliveryFeeZar),
    participantCount,
    equalShareZar,
    participants: shares,
    heyBarAbsorbsZar,
    participantsPayTotalZar,
  };
}

function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
}
