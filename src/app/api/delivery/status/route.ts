import { NextResponse } from "next/server";
import {
  DELIVERY_STUB_FEES,
  deliveryStore,
} from "@/lib/adapters/delivery";
import { getOrder } from "@/data/orders";

/**
 * GET /api/delivery/status?orderId=
 * Stub shipment status + OPEN territory fee constants.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = (searchParams.get("orderId") ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const seed = getOrder(orderId);
  const shipment = deliveryStore.ensureShipment(orderId, {
    kind: seed?.kind ?? "solo",
    status: seed?.fulfillmentStatus,
    stubFeeZar: seed?.deliveryFeeZar,
    addressSummary: "Demo address · territory OPEN",
  });

  return NextResponse.json({
    status: "stub",
    provider: "OPEN",
    territoryFlag: DELIVERY_STUB_FEES.territoryFlag,
    stubFees: DELIVERY_STUB_FEES,
    shipment,
    events: deliveryStore.listEventsForOrder(orderId),
  });
}
