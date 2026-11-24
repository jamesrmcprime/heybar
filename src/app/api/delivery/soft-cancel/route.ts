import { NextResponse } from "next/server";
import { deliveryStore } from "@/lib/adapters/delivery";
import { getOrder } from "@/data/orders";

/**
 * POST /api/delivery/soft-cancel
 * Stub: soft-cancel fulfillment — status transition only, no hard-delete.
 * Does not invent refund / XP / Tops rules.
 */
export async function POST(request: Request) {
  let body: { orderId?: string; note?: string };
  try {
    body = (await request.json()) as { orderId?: string; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const note = typeof body.note === "string" ? body.note : undefined;
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

  const result = await deliveryStore.softCancel(orderId, note);
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
      "Soft-cancelled — shipment + history retained. Participant carts/payments not hard-deleted. Provider/territory OPEN.",
  });
}
