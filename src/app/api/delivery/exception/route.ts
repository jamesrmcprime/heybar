import { NextResponse } from "next/server";
import { deliveryStore } from "@/lib/adapters/delivery";
import { getOrder } from "@/data/orders";

/**
 * POST /api/delivery/exception
 * Stub: raise fulfillment exception — shipment retained, peers untouched.
 */
export async function POST(request: Request) {
  let body: { orderId?: string; note?: string };
  try {
    body = (await request.json()) as { orderId?: string; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const note = typeof body.note === "string" ? body.note : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const seed = getOrder(orderId);
  deliveryStore.ensureShipment(orderId, {
    kind: seed?.kind ?? "solo",
    status: seed?.fulfillmentStatus,
    stubFeeZar: seed?.deliveryFeeZar,
    addressSummary: "Demo address · territory OPEN",
  });

  const result = await deliveryStore.raiseException(orderId, note);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  return NextResponse.json({
    status: "stub",
    provider: "OPEN",
    territoryFlag: "OPEN",
    shipment: result.shipment,
    event: result.event,
    message:
      "Exception recorded — shipment retained (no hard-delete). Peers untouched. Provider/territory OPEN.",
  });
}
