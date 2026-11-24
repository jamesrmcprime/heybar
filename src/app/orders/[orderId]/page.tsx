import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import { OrderRoom } from "@/components/orders/OrderRoom";
import { ORDERS, getOrder } from "@/data/orders";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export function generateStaticParams() {
  return ORDERS.map((o) => ({ orderId: o.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  const order = getOrder(orderId);
  return { title: order ? order.title : "Order" };
}

/**
 * Shared / solo order room — sealed bottles only.
 * Delivery split + HeyBar absorption from computeDeliveryAbsorption.
 * Stub mutations: leave/abandon, pay-fail via signed payment stub, remove participant.
 * Live payment provider, XP / Bottle Tops: not invented.
 */
export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = getOrder(orderId);
  if (!order) notFound();

  return (
    <>
      <StackHeader title="Order" backHref="/orders" />
      <OrderRoom initialOrder={order} />
    </>
  );
}
