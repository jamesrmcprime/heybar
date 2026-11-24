/**
 * Order-status notifications stub — interface + in-memory log only.
 *
 * Aligns with delivery status vocabulary (architecture §7.1 / DeliveryStore):
 *   preparation → assigned → pickup → in_transit → delivered
 *   side paths: exception | cancelled
 *
 * OPEN: notification channel pick (push / SMS / email / WhatsApp / etc.).
 * Do not invent FCM, APNs, Twilio, SendGrid, or other provider credentials here.
 * Channel adapters plug in where marked TODO / OPEN below.
 */

import type {
  DeliveryEventKind,
  DeliveryStatus,
} from "@/lib/adapters/delivery";

/** Channels remain OPEN — no live adapters in this stub. */
export type NotificationChannel =
  | "push"
  | "sms"
  | "email"
  | "whatsapp";

export const NOTIFICATION_CHANNELS_OPEN = {
  configured: false as const,
  flag: "OPEN" as const,
  /** No provider wired — channel pick is owner/product decision. */
  providers: null,
  note: "Notification channels · OPEN (stub records events only; no send)",
} as const;

export type OrderStatusNotificationEvent = {
  id: string;
  kind: "order_status_change";
  orderId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  /** Mirrors the delivery transition that triggered this notice. */
  deliveryEventKind: DeliveryEventKind;
  /**
   * Placeholder copy only — real templates / localization remain OPEN
   * with the channel pick.
   */
  placeholderBody: string;
  /**
   * Always empty in the stub. When channel adapters land, list attempted
   * channels here (still no inventing providers until OPEN is closed).
   */
  channelsAttempted: NotificationChannel[];
  /** Always false until a real channel adapter sends. */
  delivered: false;
  recordedAt: string;
};

export type NotifyOrderStatusChangeInput = {
  orderId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  deliveryEventKind: DeliveryEventKind;
  /** Optional note (e.g. exception / soft-cancel reason) for the placeholder. */
  note?: string | null;
};

let eventSeq = 0;

function nextEventId(): string {
  eventSeq += 1;
  return `notif_evt_${eventSeq}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function buildPlaceholderBody(input: NotifyOrderStatusChangeInput): string {
  const from = input.fromStatus ?? "none";
  const note = input.note?.trim();
  const base = `Order ${input.orderId}: ${from} → ${input.toStatus} (${input.deliveryEventKind})`;
  return note ? `${base} · ${note}` : base;
}

/**
 * Append-only in-memory notification log.
 * Process-local stub — replace with durable outbox when channels land.
 */
export class OrderStatusNotificationStore {
  private events: OrderStatusNotificationEvent[] = [];

  listEvents(): OrderStatusNotificationEvent[] {
    return [...this.events];
  }

  listEventsForOrder(orderId: string): OrderStatusNotificationEvent[] {
    return this.events.filter((e) => e.orderId === orderId);
  }

  lastEvent(): OrderStatusNotificationEvent | undefined {
    return this.events[this.events.length - 1];
  }

  clear(): void {
    this.events = [];
  }

  /**
   * Record an order-status change. Does **not** send on any channel.
   *
   * TODO / OPEN: plug channel adapters here (push / SMS / email / WhatsApp).
   * Do not invent provider SDKs or credentials until the channel pick lands.
   */
  notifyOrderStatusChange(
    input: NotifyOrderStatusChangeInput,
  ): OrderStatusNotificationEvent {
    const orderId = input.orderId.trim();
    if (!orderId) {
      throw new Error("orderId required for order-status notification");
    }

    const event: OrderStatusNotificationEvent = {
      id: nextEventId(),
      kind: "order_status_change",
      orderId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      deliveryEventKind: input.deliveryEventKind,
      placeholderBody: buildPlaceholderBody({ ...input, orderId }),
      // OPEN: no channel send — adapters would populate this after attempting delivery
      channelsAttempted: [],
      delivered: false,
      recordedAt: isoNow(),
    };

    this.events.push(event);

    // TODO / OPEN — channel adapters:
    // for (const channel of selectedChannels) { await adapters[channel].send(event) }
    // Until then: no-op send (event recorded only).

    return event;
  }
}

/** Default process-local store for stubs, API hooks, and unit tests. */
export const orderStatusNotificationStore = new OrderStatusNotificationStore();

/** Convenience wrapper over the default store. */
export function notifyOrderStatusChange(
  input: NotifyOrderStatusChangeInput,
): OrderStatusNotificationEvent {
  return orderStatusNotificationStore.notifyOrderStatusChange(input);
}
