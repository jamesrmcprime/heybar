import { NextResponse } from "next/server";
import { deliveryStore } from "@/lib/adapters/delivery";
import { getOrder } from "@/data/orders";

/**
 * POST /api/delivery/advance
 * Stub: advance fulfillment one happy-path step.
 * Territory / provider remain OPEN — no live dispatch.
 */
export async function POST(request: Request) {
  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
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

  const result = await deliveryStore.advance(orderId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  return NextResponse.json({
    status: "stub",
    provider: "OPEN",
    territoryFlag: "OPEN",
    shipment: result.shipment,
    event: result.event,
    message: `Advanced to ${result.shipment.status}. Provider/territory OPEN.`,
  });
}
