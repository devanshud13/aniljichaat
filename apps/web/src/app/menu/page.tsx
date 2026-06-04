import { MenuPageLoader } from "@/components/menu/menu-page-loader";

export const metadata = { title: "Menu" };
export const dynamic = "force-dynamic";

export default function MenuPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-brand text-4xl font-extrabold text-[#8b1a1a]">Our Menu</h1>
      <p className="mt-2 text-[#5c4a3a]">Fresh chaat, golgappe, and more — live from our kitchen</p>
      <MenuPageLoader />
    </div>
  );
}
