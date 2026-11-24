import { NextResponse } from "next/server";
import { paymentStore } from "@/lib/adapters/payment";

/**
 * Signed webhook stub (idempotent).
 * Expects header `x-heybar-payment-signature: sha256=<hex>`.
 * No live provider — OPEN A7.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-heybar-payment-signature");
  const rawBody = await request.text();

  const result = await paymentStore.handleWebhook(rawBody, signature);

  if (!result.accepted) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
}
