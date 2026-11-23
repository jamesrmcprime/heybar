/**
 * Delivery dispatch adapter — STUB
 *
 * OPEN (architecture A8): delivery model, territory, fee schedule, and provider.
 * Status vocabulary mirrors architecture §7.1.
 */

export type DeliveryStatus =
  | "preparation"
  | "assigned"
  | "pickup"
  | "in_transit"
  | "delivered"
  | "exception"
  | "cancelled";

export type DispatchRequest = {
  orderId: string;
  addressSummary: string;
};

export type DispatchResult = {
  status: "stub";
  provider: "OPEN";
  trackingId: null;
  message: string;
};

export interface DeliveryAdapter {
  dispatch(req: DispatchRequest): Promise<DispatchResult>;
  getStatus(orderId: string): Promise<DeliveryStatus | "unknown">;
}

export const stubDeliveryAdapter: DeliveryAdapter = {
  async dispatch(req) {
    return {
      status: "stub",
      provider: "OPEN",
      trackingId: null,
      message: `Delivery adapter stub — model/provider OPEN. Order ${req.orderId} not dispatched.`,
    };
  },

  async getStatus() {
    return "unknown";
  },
};
