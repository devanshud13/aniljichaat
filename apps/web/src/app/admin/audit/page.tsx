"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { apiAuth } from "@/lib/api";

interface Log {
  action: string;
  entityType: string;
  createdAt: string;
  userId?: { username?: string };
  metadata?: Record<string, unknown>;
}

export default function AdminAuditPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const res = await apiAuth<Log[]>("/admin/audit-logs");
      return res.data ?? [];
    },
  });

  return (
    <AdminShell title="Audit Logs">
      <div className="overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fbf3e8] text-[#5c4a3a]">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="border-t border-[#f0e6d8]">
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3">{log.entityType}</td>
                <td className="px-4 py-3">{log.userId?.username ?? "—"}</td>
                <td className="px-4 py-3 text-[#9a8b7a]">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#9a8b7a]">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
