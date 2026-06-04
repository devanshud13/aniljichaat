import { OrderPageLoader } from "@/components/order/order-page-loader";

export const metadata = { title: "Order Online" };
export const dynamic = "force-dynamic";

export default function OrderPage() {
  return <OrderPageLoader />;
}
