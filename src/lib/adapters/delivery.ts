/**
 * Delivery dispatch adapter — status-machine STUB
 *
 * OPEN (architecture A8): delivery model, territory, fee schedule, and provider.
 * Status vocabulary mirrors architecture §7.1:
 *   preparation → assigned → pickup → in_transit → delivered
 *   side paths: exception | cancelled (soft — no hard-deletes)
 *
 * Stub fee constants are demo seeds only. Territory remains flagged OPEN.
 * Do not invent a live geo schedule or dispatch provider here.
 *
 * Successful status transitions emit order-status notification stubs
 * (in-memory log only — channels OPEN; see @/lib/notifications).
 */

import { notifyOrderStatusChange } from "@/lib/notifications";

export type DeliveryStatus =
  | "preparation"
  | "assigned"
  | "pickup"
  | "in_transit"
  | "delivered"
  | "exception"
  | "cancelled";

/** Happy-path forward steps (architecture §7.1). */
export const DELIVERY_FORWARD: readonly DeliveryStatus[] = [
  "preparation",
  "assigned",
  "pickup",
  "in_transit",
  "delivered",
] as const;

export const DELIVERY_TERMINAL: ReadonlySet<DeliveryStatus> = new Set([
  "delivered",
  "exception",
  "cancelled",
]);

/**
 * Configurable stub fee constants — NOT a live territory schedule.
 * Territory / commercial pricing remain OPEN (A8).
 */
export const DELIVERY_STUB_FEES = {
  currency: "ZAR" as const,
  /** Live geo coverage not configured */
  territoryConfigured: false,
  territoryFlag: "OPEN" as const,
  /** Demo seed for solo orders */
  soloBaseZar: 30,
  /** Demo seed matching brief §2.3 shared example */
  sharedBaseZar: 100,
  note: "Delivery territory / fee schedule · OPEN (stub constants only)",
} as const;

export type DispatchRequest = {
  orderId: string;
  addressSummary: string;
  /** "shared" | "solo" — picks stub fee constant only */
  kind?: "shared" | "solo";
};

export type DispatchResult = {
  status: "stub";
  provider: "OPEN";
  trackingId: null;
  fulfillmentStatus: DeliveryStatus;
  stubFeeZar: number;
  territoryFlag: "OPEN";
  message: string;
};

export type DeliveryEventKind =
  | "dispatch"
  | "advance"
  | "exception"
  | "soft_cancel";

export type DeliveryEvent = {
  id: string;
  orderId: string;
  kind: DeliveryEventKind;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  note: string | null;
  recordedAt: string;
};

export type DeliveryShipment = {
  orderId: string;
  status: DeliveryStatus;
  addressSummary: string;
  kind: "shared" | "solo";
  stubFeeZar: number;
  exceptionNote: string | null;
  /** Soft-cancel flag — record retained (no hard-delete) */
  softCancelled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TransitionOk = {
  ok: true;
  shipment: DeliveryShipment;
  event: DeliveryEvent;
};

export type TransitionErr = {
  ok: false;
  reason: string;
};

export type TransitionResult = TransitionOk | TransitionErr;

export interface DeliveryAdapter {
  dispatch(req: DispatchRequest): Promise<DispatchResult>;
  getStatus(orderId: string): Promise<DeliveryStatus | "unknown">;
  advance(orderId: string): Promise<TransitionResult>;
  raiseException(orderId: string, note: string): Promise<TransitionResult>;
  softCancel(orderId: string, note?: string): Promise<TransitionResult>;
}

function isoNow(): string {
  return new Date().toISOString();
}

let eventSeq = 0;

function nextEventId(): string {
  eventSeq += 1;
  return `del_evt_${eventSeq}`;
}

export function stubFeeForKind(kind: "shared" | "solo"): number {
  return kind === "shared"
    ? DELIVERY_STUB_FEES.sharedBaseZar
    : DELIVERY_STUB_FEES.soloBaseZar;
}

export function deliveryStatusLabel(status: DeliveryStatus): string {
  switch (status) {
    case "preparation":
      return "Preparation";
    case "assigned":
      return "Assigned";
    case "pickup":
      return "Pickup";
    case "in_transit":
      return "In transit";
    case "delivered":
      return "Delivered";
    case "exception":
      return "Exception";
    case "cancelled":
      return "Cancelled";
  }
}

/** Next happy-path status, or null if terminal / unknown. */
export function nextForwardStatus(
  current: DeliveryStatus,
): DeliveryStatus | null {
  const idx = DELIVERY_FORWARD.indexOf(current);
  if (idx < 0 || idx >= DELIVERY_FORWARD.length - 1) return null;
  return DELIVERY_FORWARD[idx + 1]!;
}

export function canAdvance(status: DeliveryStatus): boolean {
  return nextForwardStatus(status) !== null;
}

export function canRaiseException(status: DeliveryStatus): boolean {
  return !DELIVERY_TERMINAL.has(status);
}

export function canSoftCancel(status: DeliveryStatus): boolean {
  return status !== "delivered" && status !== "cancelled";
}

/**
 * In-memory shipment registry + append-only event log.
 * Soft cancel / exception keep the shipment row — never hard-delete.
 * Process-local stub — replace when OPEN A8 lands.
 */
export class DeliveryStore implements DeliveryAdapter {
  private shipments = new Map<string, DeliveryShipment>();
  private events: DeliveryEvent[] = [];

  /**
   * Start (or re-read) a stub shipment in preparation.
   * Idempotent on orderId — existing row is returned, not replaced.
   */
  async dispatch(req: DispatchRequest): Promise<DispatchResult> {
    const kind = req.kind ?? "solo";
    const stubFeeZar = stubFeeForKind(kind);
    const existing = this.shipments.get(req.orderId);

    if (existing) {
      return {
        status: "stub",
        provider: "OPEN",
        trackingId: null,
        fulfillmentStatus: existing.status,
        stubFeeZar: existing.stubFeeZar,
        territoryFlag: "OPEN",
        message: `Delivery adapter stub — shipment already tracked (${existing.status}). Provider/territory OPEN. Order ${req.orderId}.`,
      };
    }

    const now = isoNow();
    const shipment: DeliveryShipment = {
      orderId: req.orderId,
      status: "preparation",
      addressSummary: req.addressSummary,
      kind,
      stubFeeZar,
      exceptionNote: null,
      softCancelled: false,
      createdAt: now,
      updatedAt: now,
    };
    this.shipments.set(req.orderId, shipment);

    this.appendEvent({
      orderId: req.orderId,
      kind: "dispatch",
      fromStatus: null,
      toStatus: "preparation",
      note: req.addressSummary || null,
    });
    this.emitStatusNotification({
      orderId: req.orderId,
      fromStatus: null,
      toStatus: "preparation",
      deliveryEventKind: "dispatch",
      note: req.addressSummary || null,
    });

    return {
      status: "stub",
      provider: "OPEN",
      trackingId: null,
      fulfillmentStatus: "preparation",
      stubFeeZar,
      territoryFlag: "OPEN",
      message: `Delivery adapter stub — model/provider OPEN. Order ${req.orderId} entered preparation. Stub fee R${stubFeeZar.toFixed(2)} (territory OPEN).`,
    };
  }

  async getStatus(orderId: string): Promise<DeliveryStatus | "unknown"> {
    return this.shipments.get(orderId)?.status ?? "unknown";
  }

  getShipment(orderId: string): DeliveryShipment | undefined {
    return this.shipments.get(orderId);
  }

  listShipments(): DeliveryShipment[] {
    return [...this.shipments.values()];
  }

  listEvents(): DeliveryEvent[] {
    return [...this.events];
  }

  listEventsForOrder(orderId: string): DeliveryEvent[] {
    return this.events.filter((e) => e.orderId === orderId);
  }

  /** Ensure a tracked shipment exists (seeds demo orders into the store). */
  ensureShipment(
    orderId: string,
    opts: {
      kind: "shared" | "solo";
      status?: DeliveryStatus;
      addressSummary?: string;
      stubFeeZar?: number;
    },
  ): DeliveryShipment {
    const existing = this.shipments.get(orderId);
    if (existing) return existing;

    const now = isoNow();
    const status = opts.status ?? "preparation";
    const shipment: DeliveryShipment = {
      orderId,
      status,
      addressSummary: opts.addressSummary ?? "Demo address · territory OPEN",
      kind: opts.kind,
      stubFeeZar: opts.stubFeeZar ?? stubFeeForKind(opts.kind),
      exceptionNote: null,
      softCancelled: status === "cancelled",
      createdAt: now,
      updatedAt: now,
    };
    this.shipments.set(orderId, shipment);
    this.appendEvent({
      orderId,
      kind: "dispatch",
      fromStatus: null,
      toStatus: status,
      note: "seed ensure",
    });
    return shipment;
  }

  /**
   * Advance one happy-path step.
   * Does not mutate peer payment or cart records (fulfillment only).
   */
  async advance(orderId: string): Promise<TransitionResult> {
    const shipment = this.shipments.get(orderId);
    if (!shipment) {
      return { ok: false, reason: "Unknown shipment — dispatch first" };
    }
    if (shipment.softCancelled || shipment.status === "cancelled") {
      return { ok: false, reason: "Shipment soft-cancelled — cannot advance" };
    }
    const next = nextForwardStatus(shipment.status);
    if (!next) {
      return {
        ok: false,
        reason: `Cannot advance from ${shipment.status}`,
      };
    }

    const from = shipment.status;
    shipment.status = next;
    shipment.updatedAt = isoNow();
    const event = this.appendEvent({
      orderId,
      kind: "advance",
      fromStatus: from,
      toStatus: next,
      note: null,
    });
    this.emitStatusNotification({
      orderId,
      fromStatus: from,
      toStatus: next,
      deliveryEventKind: "advance",
      note: null,
    });

    return { ok: true, shipment: { ...shipment }, event };
  }

  /**
   * Raise an exception — shipment retained, peers untouched.
   * Allowed from non-terminal statuses.
   */
  async raiseException(
    orderId: string,
    note: string,
  ): Promise<TransitionResult> {
    const shipment = this.shipments.get(orderId);
    if (!shipment) {
      return { ok: false, reason: "Unknown shipment — dispatch first" };
    }
    if (!canRaiseException(shipment.status)) {
      return {
        ok: false,
        reason: `Cannot raise exception from ${shipment.status}`,
      };
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return { ok: false, reason: "Exception note required" };
    }

    const from = shipment.status;
    shipment.status = "exception";
    shipment.exceptionNote = trimmed;
    shipment.updatedAt = isoNow();
    const event = this.appendEvent({
      orderId,
      kind: "exception",
      fromStatus: from,
      toStatus: "exception",
      note: trimmed,
    });
    this.emitStatusNotification({
      orderId,
      fromStatus: from,
      toStatus: "exception",
      deliveryEventKind: "exception",
      note: trimmed,
    });

    return { ok: true, shipment: { ...shipment }, event };
  }

  /**
   * Soft cancel — status → cancelled; shipment + event history kept.
   * Never hard-deletes money-adjacent or participant rows (fulfillment only).
   */
  async softCancel(
    orderId: string,
    note?: string,
  ): Promise<TransitionResult> {
    const shipment = this.shipments.get(orderId);
    if (!shipment) {
      return { ok: false, reason: "Unknown shipment — dispatch first" };
    }
    // Idempotent: already soft-cancelled keeps the retained row.
    if (shipment.status === "cancelled" && shipment.softCancelled) {
      const event =
        this.listEventsForOrder(orderId).find((e) => e.kind === "soft_cancel") ??
        this.appendEvent({
          orderId,
          kind: "soft_cancel",
          fromStatus: "cancelled",
          toStatus: "cancelled",
          note: note?.trim() || "soft cancel (idempotent)",
        });
      return { ok: true, shipment: { ...shipment }, event };
    }
    if (!canSoftCancel(shipment.status)) {
      return {
        ok: false,
        reason: `Cannot soft-cancel from ${shipment.status}`,
      };
    }

    const from = shipment.status;
    shipment.status = "cancelled";
    shipment.softCancelled = true;
    shipment.updatedAt = isoNow();
    const cancelNote = note?.trim() || "soft cancel";
    const event = this.appendEvent({
      orderId,
      kind: "soft_cancel",
      fromStatus: from,
      toStatus: "cancelled",
      note: cancelNote,
    });
    this.emitStatusNotification({
      orderId,
      fromStatus: from,
      toStatus: "cancelled",
      deliveryEventKind: "soft_cancel",
      note: cancelNote,
    });

    return { ok: true, shipment: { ...shipment }, event };
  }

  private appendEvent(partial: {
    orderId: string;
    kind: DeliveryEventKind;
    fromStatus: DeliveryStatus | null;
    toStatus: DeliveryStatus;
    note: string | null;
  }): DeliveryEvent {
    const event: DeliveryEvent = {
      id: nextEventId(),
      orderId: partial.orderId,
      kind: partial.kind,
      fromStatus: partial.fromStatus,
      toStatus: partial.toStatus,
      note: partial.note,
      recordedAt: isoNow(),
    };
    this.events.push(event);
    return event;
  }

  /**
   * Hook into the notifications stub on every real status change.
   * No-op send — records only. Channels remain OPEN.
   */
  private emitStatusNotification(input: {
    orderId: string;
    fromStatus: DeliveryStatus | null;
    toStatus: DeliveryStatus;
    deliveryEventKind: DeliveryEventKind;
    note: string | null;
  }): void {
    notifyOrderStatusChange(input);
  }
}

/** Default process-local store for stubs, API routes, and smoke checks. */
export const deliveryStore = new DeliveryStore();

export const stubDeliveryAdapter: DeliveryAdapter = {
  dispatch(req) {
    return deliveryStore.dispatch(req);
  },
  getStatus(orderId) {
    return deliveryStore.getStatus(orderId);
  },
  advance(orderId) {
    return deliveryStore.advance(orderId);
  },
  raiseException(orderId, note) {
    return deliveryStore.raiseException(orderId, note);
  },
  softCancel(orderId, note) {
    return deliveryStore.softCancel(orderId, note);
  },
};
