/**
 * Orders + shared-order seed for Night Seal Orders tab.
 * Sealed bottles only. Delivery fee is a demo seed — territory/pricing OPEN.
 * Totals are server-stubbed via computeDeliveryAbsorption +
 * applyMembershipProductDiscount — do not trust client-entered money.
 *
 * Fulfillment status is separate from per-participant paymentState.
 * Soft cancel / exception are status transitions — no hard-deletes.
 */

import { BOTTLE_SEED, type Bottle } from "./bottles";
import { DEMO_USER } from "./demo-user";
import { FRIEND_PEOPLE, displayName, type FriendPerson } from "./friends";
import { MEMBERSHIP_TIERS } from "./memberships";
import {
  computeDeliveryAbsorption,
  type DeliveryAbsorptionResult,
} from "@/lib/delivery-absorption";
import {
  applyMembershipProductDiscount,
  roundZar,
} from "@/lib/membership-discount";
import {
  deliveryStatusLabel,
  type DeliveryStatus,
} from "@/lib/adapters/delivery";

export type OrderKind = "shared" | "solo";

export type PaymentState =
  | "awaiting_pay"
  | "failed"
  | "paid"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/** Participants still on the delivery split (abandoned/cancelled are excluded). */
export function participantsForDelivery(
  participants: ParticipantSeed[],
): ParticipantSeed[] {
  return participants.filter((p) => p.paymentState !== "cancelled");
}

export type LineItemSeed = {
  bottleId: string;
  qty: number;
};

export type ParticipantSeed = {
  id: string;
  /** Demo user host, or friends graph person id */
  personKey: "self" | string;
  membershipId: string;
  locked: boolean;
  paymentState: PaymentState;
  lines: LineItemSeed[];
};

export type OrderSeed = {
  id: string;
  kind: OrderKind;
  title: string;
  statusLabel: string;
  pending: boolean;
  note: string;
  active: boolean;
  /** Seed delivery fee ZAR — schedule OPEN */
  deliveryFeeZar: number;
  /** Fulfillment / delivery adapter status (architecture §7.1) */
  fulfillmentStatus: DeliveryStatus;
  /** Ops exception note when fulfillmentStatus === exception */
  exceptionNote?: string;
  hostParticipantId: string;
  participants: ParticipantSeed[];
  /** Past solo orders may only need a display date */
  pastDateLabel?: string;
};

/** Friday night run — brief §2.3 example cast (4 tiers, R100 delivery). */
export const ORDERS: OrderSeed[] = [
  {
    id: "ORD-8F2A",
    kind: "shared",
    title: "Friday night run",
    statusLabel: "Awaiting pay",
    pending: true,
    note: "Your share locked · delivery split applied",
    active: true,
    deliveryFeeZar: 100,
    fulfillmentStatus: "preparation",
    hostParticipantId: "part-sam",
    participants: [
      {
        id: "part-sam",
        personKey: "self",
        membershipId: "top-shelf",
        locked: true,
        paymentState: "awaiting_pay",
        lines: [
          { bottleId: "bottle-tanqueray", qty: 1 },
          { bottleId: "bottle-absolut", qty: 1 },
        ],
      },
      {
        id: "part-alex",
        personKey: "alex-k",
        membershipId: "straight-up",
        locked: true,
        paymentState: "awaiting_pay",
        lines: [{ bottleId: "bottle-bacardi-superior", qty: 1 }],
      },
      {
        id: "part-dave",
        personKey: "dave-person",
        membershipId: "neat",
        locked: false,
        paymentState: "awaiting_pay",
        lines: [{ bottleId: "bottle-bombay-sapphire", qty: 1 }],
      },
      {
        id: "part-riley",
        personKey: "riley-m",
        membershipId: "the-reserve",
        locked: true,
        paymentState: "paid",
        lines: [{ bottleId: "bottle-jameson", qty: 1 }],
      },
    ],
  },
  {
    id: "ORD-3C91",
    kind: "solo",
    title: "Quick top-up",
    statusLabel: "In transit",
    pending: false,
    note: "Driver assigned · ETA tonight",
    active: true,
    deliveryFeeZar: 30,
    fulfillmentStatus: "in_transit",
    hostParticipantId: "part-solo-sam",
    participants: [
      {
        id: "part-solo-sam",
        personKey: "self",
        membershipId: DEMO_USER.membershipId,
        locked: true,
        paymentState: "out_for_delivery",
        lines: [{ bottleId: "bottle-absolut", qty: 1 }],
      },
    ],
  },
  {
    id: "ORD-11B0",
    kind: "solo",
    title: "Weeknight gin",
    statusLabel: "Delivered",
    pending: false,
    note: "Delivered",
    active: false,
    deliveryFeeZar: 25,
    fulfillmentStatus: "delivered",
    pastDateLabel: "12 Sep 2026",
    hostParticipantId: "part-past-sam",
    participants: [
      {
        id: "part-past-sam",
        personKey: "self",
        membershipId: DEMO_USER.membershipId,
        locked: true,
        paymentState: "delivered",
        lines: [{ bottleId: "bottle-tanqueray", qty: 1 }],
      },
    ],
  },
];

export function getOrder(id: string): OrderSeed | undefined {
  return ORDERS.find((o) => o.id === id);
}

export function activeOrders(): OrderSeed[] {
  return ORDERS.filter((o) => o.active);
}

export function pastOrders(): OrderSeed[] {
  return ORDERS.filter((o) => !o.active);
}

export function sharedActiveOrders(): OrderSeed[] {
  return ORDERS.filter((o) => o.active && o.kind === "shared");
}

export function getBottle(id: string): Bottle | undefined {
  return BOTTLE_SEED.find((b) => b.id === id);
}

export type ResolvedParticipant = {
  id: string;
  displayName: string;
  initials: string;
  membershipId: string;
  membershipName: string;
  productDiscountPct: number;
  deliveryDiscountPct: number;
  locked: boolean;
  paymentState: PaymentState;
  lines: { bottle: Bottle; qty: number; lineListZar: number }[];
  /** Sum of list prices before product discount */
  listSubtotalZar: number;
  /** After membership product % (own purchases only) */
  productSubtotalZar: number;
  bottleCount: number;
};

export type ResolvedOrder = {
  order: OrderSeed;
  participants: ResolvedParticipant[];
  delivery: DeliveryAbsorptionResult;
  /** Viewer (demo self) participant, if present */
  self: ResolvedParticipant | undefined;
  selfDeliveryPaysZar: number;
  /** Self product + delivery share they pay */
  selfPayableZar: number;
  totalBottles: number;
};

function membershipById(id: string) {
  return MEMBERSHIP_TIERS.find((t) => t.id === id)!;
}

function resolvePerson(
  personKey: "self" | string,
): { displayName: string; initials: string } {
  if (personKey === "self") {
    return {
      displayName: `${DEMO_USER.firstName} ${DEMO_USER.lastName}`,
      initials: DEMO_USER.initials,
    };
  }
  const person = FRIEND_PEOPLE.find((p) => p.id === personKey) as
    | FriendPerson
    | undefined;
  if (!person) {
    return { displayName: personKey, initials: "?" };
  }
  return {
    displayName: displayName(person),
    initials: person.initials,
  };
}

export function resolveParticipant(p: ParticipantSeed): ResolvedParticipant {
  const tier = membershipById(p.membershipId);
  const person = resolvePerson(p.personKey);
  const pricedLines = p.lines.map((line) => {
    const bottle = getBottle(line.bottleId);
    if (!bottle) {
      throw new Error(`Missing bottle seed: ${line.bottleId}`);
    }
    return {
      bottle,
      qty: line.qty,
      listUnitZar: bottle.priceZar,
    };
  });

  // Brief-table product % via membership-discount (sealed bottles only).
  const discounted = applyMembershipProductDiscount(
    p.membershipId,
    pricedLines.map((l) => ({
      bottleId: l.bottle.id,
      qty: l.qty,
      listUnitZar: l.listUnitZar,
    })),
  );
  if (!discounted.ok) {
    throw new Error(
      `Product discount failed (${discounted.reason})${
        discounted.bottleId ? `: ${discounted.bottleId}` : ""
      }`,
    );
  }

  const lines = pricedLines.map((l, index) => ({
    bottle: l.bottle,
    qty: l.qty,
    lineListZar: discounted.lines[index]?.lineListZar ?? 0,
  }));
  const bottleCount = lines.reduce((sum, l) => sum + l.qty, 0);

  return {
    id: p.id,
    displayName: person.displayName,
    initials: person.initials,
    membershipId: p.membershipId,
    membershipName: discounted.membershipName,
    productDiscountPct: discounted.productDiscountPct,
    deliveryDiscountPct: tier.deliveryDiscountPct,
    locked: p.locked,
    paymentState: p.paymentState,
    lines,
    listSubtotalZar: discounted.listSubtotalZar,
    productSubtotalZar: discounted.productSubtotalZar,
    bottleCount,
  };
}

export function resolveOrder(order: OrderSeed): ResolvedOrder {
  const participants = order.participants.map(resolveParticipant);
  const deliverySeeds = participantsForDelivery(order.participants);
  const delivery =
    deliverySeeds.length > 0
      ? computeDeliveryAbsorption(
          order.deliveryFeeZar,
          deliverySeeds.map((seed) => {
            const resolved = participants.find((p) => p.id === seed.id)!;
            return {
              id: resolved.id,
              deliveryDiscountPct: resolved.deliveryDiscountPct,
            };
          }),
        )
      : {
          deliveryFeeZar: roundZar(order.deliveryFeeZar),
          participantCount: 0,
          equalShareZar: 0,
          participants: [],
          heyBarAbsorbsZar: 0,
          participantsPayTotalZar: 0,
        };
  const self = participants.find((p) => {
    const seed = order.participants.find((s) => s.id === p.id);
    return seed?.personKey === "self";
  });
  const selfShare = self
    ? delivery.participants.find((d) => d.id === self.id)
    : undefined;
  const selfDeliveryPaysZar = selfShare?.participantPaysZar ?? 0;
  const selfPayableZar = self
    ? roundZar(self.productSubtotalZar + selfDeliveryPaysZar)
    : 0;
  const totalBottles = participants.reduce((sum, p) => sum + p.bottleCount, 0);

  return {
    order,
    participants,
    delivery,
    self,
    selfDeliveryPaysZar,
    selfPayableZar,
    totalBottles,
  };
}

/** Mark one participant abandoned/cancelled — others untouched (DEF-SO-1). */
export function abandonParticipant(
  order: OrderSeed,
  participantId: string,
): OrderSeed {
  return {
    ...order,
    participants: order.participants.map((p) =>
      p.id === participantId ? { ...p, paymentState: "cancelled" } : p,
    ),
  };
}

/** Drop a participant from the order — remaining records intact (DEF-SO-3). */
export function removeParticipant(
  order: OrderSeed,
  participantId: string,
): OrderSeed {
  return {
    ...order,
    participants: order.participants.filter((p) => p.id !== participantId),
  };
}

/** Set payment state for one participant only — others untouched (DEF-SO-2). */
export function setParticipantPaymentState(
  order: OrderSeed,
  participantId: string,
  paymentState: PaymentState,
): OrderSeed {
  return {
    ...order,
    participants: order.participants.map((p) =>
      p.id === participantId ? { ...p, paymentState } : p,
    ),
  };
}

/**
 * Apply fulfillment status from the delivery adapter.
 * Does not mutate participant carts or payment states (peer-safe).
 */
export function setOrderFulfillmentStatus(
  order: OrderSeed,
  fulfillmentStatus: DeliveryStatus,
  opts?: { exceptionNote?: string | null; note?: string },
): OrderSeed {
  const label = deliveryStatusLabel(fulfillmentStatus);
  const softCancelled = fulfillmentStatus === "cancelled";
  const isException = fulfillmentStatus === "exception";
  const delivered = fulfillmentStatus === "delivered";

  return {
    ...order,
    fulfillmentStatus,
    exceptionNote: isException
      ? (opts?.exceptionNote ?? order.exceptionNote)
      : undefined,
    statusLabel: label,
    pending:
      softCancelled || delivered || isException
        ? false
        : fulfillmentStatus === "preparation"
          ? order.pending
          : false,
    note:
      opts?.note ??
      (softCancelled
        ? "Soft-cancelled · records retained"
        : isException
          ? (opts?.exceptionNote ?? order.exceptionNote ?? "Exception · ops")
          : delivered
            ? "Delivered"
            : order.note),
    active: softCancelled || delivered ? false : order.active,
    // Participants intentionally unchanged — soft cancel is fulfillment-only.
    participants: order.participants,
  };
}

/**
 * Soft-cancel the order at fulfillment level.
 * Keeps every participant row and their paymentState (no hard-delete).
 */
export function softCancelOrder(
  order: OrderSeed,
  note?: string,
): OrderSeed {
  return setOrderFulfillmentStatus(order, "cancelled", {
    note: note ?? "Soft-cancelled · records retained",
  });
}

/** Raise fulfillment exception — participants untouched. */
export function raiseOrderException(
  order: OrderSeed,
  exceptionNote: string,
): OrderSeed {
  return setOrderFulfillmentStatus(order, "exception", {
    exceptionNote,
    note: exceptionNote,
  });
}

/** List-row amount: self payable when present, else first participant. */
export function orderListAmountZar(order: OrderSeed): number {
  const resolved = resolveOrder(order);
  if (resolved.self) return resolved.selfPayableZar;
  return resolved.participants[0]
    ? roundZar(
        resolved.participants[0].productSubtotalZar +
          (resolved.delivery.participants[0]?.participantPaysZar ?? 0),
      )
    : 0;
}

export function orderListDetail(order: OrderSeed): string {
  if (!order.active && order.pastDateLabel) return order.pastDateLabel;
  const resolved = resolveOrder(order);
  const n = resolved.self?.bottleCount ?? resolved.totalBottles;
  return n === 1 ? "1 bottle" : `${n} bottles`;
}
