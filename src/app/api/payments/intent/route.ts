import { NextResponse } from "next/server";
import { paymentStore } from "@/lib/adapters/payment";

/**
 * Create a stub payment intent / session.
 * checkoutUrl is always null — live Pay CTA stays disabled (OPEN A7).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const participantId = record.participantId;
  const orderId = record.orderId;
  const amountCents = record.amountCents;
  const currency = record.currency;

  if (
    typeof participantId !== "string" ||
    typeof orderId !== "string" ||
    typeof amountCents !== "number" ||
    currency !== "ZAR"
  ) {
    return NextResponse.json(
      {
        error:
          "Expected { participantId, orderId, amountCents, currency: 'ZAR' }",
      },
      { status: 400 },
    );
  }

  try {
    const intent = await paymentStore.createIntent({
      participantId,
      orderId,
      amountCents,
      currency: "ZAR",
    });
    return NextResponse.json(intent);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Intent failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
