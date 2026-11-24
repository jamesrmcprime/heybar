import { NextResponse } from "next/server";
import { paymentStore } from "@/lib/adapters/payment";

/**
 * QA-only: create intent + signed failed webhook for one participant.
 * Does not enable live checkout. Other participants are untouched.
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
    const { intent, webhook } = await paymentStore.simulateParticipantFail({
      participantId,
      orderId,
      amountCents,
      currency: "ZAR",
    });

    if (!webhook.accepted) {
      return NextResponse.json({ intent, webhook }, { status: 400 });
    }

    return NextResponse.json({
      intent,
      webhook,
      message:
        "Stub payment failed for this participant only — others untouched. Live gateway still OPEN.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulate fail failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
