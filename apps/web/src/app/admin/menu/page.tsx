"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { cn } from "@/lib/utils";
import { MasterMenuTab } from "@/components/admin/menu/master-menu-tab";
import { MenuSheetsTab } from "@/components/admin/menu/menu-sheets-tab";
import { OutletMenuTab } from "@/components/admin/menu/outlet-menu-tab";

const tabs = [
  { id: "master", label: "Master Menu" },
  { id: "sheets", label: "Menu Sheets" },
  { id: "outlets", label: "Outlet Setup" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminMenuPage() {
  const [tab, setTab] = useState<TabId>("master");

  return (
    <AdminShell title="Menu Management">
      <p className="mb-4 text-sm text-[#5c4a3a]">
        Upload dishes once in <strong>Master Menu</strong>, group them in{" "}
        <strong>Menu Sheets</strong>, then choose which sheet and items each outlet sells in{" "}
        <strong>Outlet Setup</strong>.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#e8dcc8] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-[#8b1a1a] text-white" : "bg-[#f5e6d3] text-[#5c4a3a] hover:bg-[#e8dcc8]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === "master" ? "" : "hidden"}>
        <MasterMenuTab />
      </div>
      <div className={tab === "sheets" ? "" : "hidden"}>
        <MenuSheetsTab />
      </div>
      <div className={tab === "outlets" ? "" : "hidden"}>
        <OutletMenuTab />
      </div>
    </AdminShell>
  );
}
