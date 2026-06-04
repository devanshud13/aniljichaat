import { TableOrderLoader } from "@/components/order/table-order-loader";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ tableSlug: string }>;
  searchParams: Promise<{ outlet?: string }>;
}

export default async function TableOrderPage({ params, searchParams }: Props) {
  const { tableSlug } = await params;
  const { outlet = "ambala" } = await searchParams;

  return <TableOrderLoader outletSlug={outlet} tableSlug={tableSlug} />;
}
