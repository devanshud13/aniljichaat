"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, KeyRound, Power, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useOutlets } from "@/hooks/use-outlets";
import { apiAuth } from "@/lib/api";
import { Role, Permission, MANAGER_ASSIGNABLE_PERMISSIONS } from "@anilji/shared";

interface User {
  _id: string;
  username: string;
  role: string;
  isActive: boolean;
  outletIds: string[];
  permissions?: string[];
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: outlets = [] } = useOutlets();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await apiAuth<User[]>("/admin/users");
      return res.data ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (u: User) => {
      await apiAuth(`/admin/users/${u._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !u.isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <AdminShell title="Users">
      <div className="mb-4 flex justify-end">
        <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fbf3e8] text-[#5c4a3a]">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-[#f0e6d8]">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[#f5e6d3] px-2 py-0.5 text-xs font-semibold">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold ${u.isActive ? "text-green-700" : "text-gray-400"}`}
                  >
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Edit user"
                      onClick={() => setEditUser(u)}
                      className="rounded-md p-1.5 hover:bg-[#f5e6d3]"
                    >
                      <Pencil className="h-4 w-4 text-[#5c4a3a]" />
                    </button>
                    <button
                      title="Reset password"
                      onClick={() => setResetUser(u)}
                      className="rounded-md p-1.5 hover:bg-[#f5e6d3]"
                    >
                      <KeyRound className="h-4 w-4 text-[#5c4a3a]" />
                    </button>
                    <button
                      title={u.isActive ? "Disable" : "Enable"}
                      onClick={() => toggleActive.mutate(u)}
                      className="rounded-md p-1.5 hover:bg-[#f5e6d3]"
                    >
                      <Power className={`h-4 w-4 ${u.isActive ? "text-green-600" : "text-gray-400"}`} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        outlets={outlets}
        onSaved={() => {
          setAddOpen(false);
          qc.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      />

      <EditUserModal
        key={editUser?._id ?? "edit"}
        user={editUser}
        outlets={outlets}
        onClose={() => setEditUser(null)}
        onSaved={() => {
          setEditUser(null);
          qc.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      />

      <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
    </AdminShell>
  );
}

function EditUserModal({
  user,
  outlets,
  onClose,
  onSaved,
}: {
  user: User | null;
  outlets: { _id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(user?.role ?? Role.KITCHEN);
  const [outletIds, setOutletIds] = useState<string[]>(
    user?.outletIds?.map((id) => String(id)) ?? []
  );
  const [permissions, setPermissions] = useState<string[]>(user?.permissions ?? []);
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const permLabels: Record<string, string> = {
    [Permission.MENU]: "Menu",
    [Permission.OFFERS]: "Offers",
    [Permission.GALLERY]: "Gallery",
    [Permission.CMS]: "Website content",
    [Permission.OUTLETS]: "Outlets",
    [Permission.TABLES]: "Tables & QR",
    [Permission.MANAGER]: "Manager dashboard",
    [Permission.KITCHEN]: "Kitchen dashboard",
  };

  async function save() {
    if (!user) return;
    setError("");
    setSaving(true);
    const res = await apiAuth(`/admin/users/${user._id}`, {
      method: "PATCH",
      body: JSON.stringify({
        role,
        outletIds,
        permissions: role === Role.MANAGER ? permissions : [],
        isActive,
      }),
    });
    setSaving(false);
    if (res.success) onSaved();
    else setError(res.message ?? "Failed to update user");
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit User — ${user?.username ?? ""}`}>
      <div className="space-y-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 w-full rounded-md border border-[#d4c4b0] bg-white px-3 text-sm"
        >
          <option value={Role.ADMIN}>Admin</option>
          <option value={Role.MANAGER}>Manager</option>
          <option value={Role.KITCHEN}>Kitchen</option>
        </select>
        {role === Role.MANAGER && (
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">
              Tab access
            </span>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#e8dcc8] p-2">
              {MANAGER_ASSIGNABLE_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p)}
                    onChange={(e) =>
                      setPermissions((prev) =>
                        e.target.checked ? [...new Set([...prev, p])] : prev.filter((x) => x !== p)
                      )
                    }
                  />
                  {permLabels[p] ?? p}
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">
            Outlets
          </span>
          <div className="space-y-1">
            {outlets.map((o) => (
              <label key={o._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={outletIds.includes(o._id)}
                  onChange={(e) =>
                    setOutletIds((prev) =>
                      e.target.checked ? [...prev, o._id] : prev.filter((id) => id !== o._id)
                    )
                  }
                />
                {o.name}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Account active
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Modal>
  );
}

function AddUserModal({
  open,
  onClose,
  outlets,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  outlets: { _id: string; name: string }[];
  onSaved: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(Role.KITCHEN);
  const [outletIds, setOutletIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([Permission.MANAGER]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const permLabels: Record<string, string> = {
    [Permission.MENU]: "Menu",
    [Permission.OFFERS]: "Offers",
    [Permission.GALLERY]: "Gallery",
    [Permission.CMS]: "Website content",
    [Permission.OUTLETS]: "Outlets",
    [Permission.TABLES]: "Tables & QR",
    [Permission.MANAGER]: "Manager dashboard",
    [Permission.KITCHEN]: "Kitchen dashboard",
  };

  async function save() {
    setError("");
    if (username.length < 3 || password.length < 6) {
      setError("Username min 3 chars, password min 6 chars.");
      return;
    }
    setSaving(true);
    const res = await apiAuth("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        role,
        outletIds,
        permissions: role === Role.MANAGER ? permissions : [],
      }),
    });
    setSaving(false);
    if (res.success) {
      setUsername("");
      setPassword("");
      setOutletIds([]);
      onSaved();
    } else setError(res.message ?? "Failed to create user");
  }

  return (
    <Modal open={open} onClose={onClose} title="Add User">
      <div className="space-y-3">
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => {
            const r = e.target.value;
            setRole(r);
            if (r === Role.MANAGER) setPermissions([Permission.MANAGER]);
            else setPermissions([]);
          }}
          className="h-10 w-full rounded-md border border-[#d4c4b0] bg-white px-3 text-sm"
        >
          <option value={Role.ADMIN}>Admin</option>
          <option value={Role.MANAGER}>Manager</option>
          <option value={Role.KITCHEN}>Kitchen</option>
        </select>
        {role === Role.MANAGER && (
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">
              Tab access (manager)
            </span>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#e8dcc8] p-2">
              {MANAGER_ASSIGNABLE_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p)}
                    onChange={(e) =>
                      setPermissions((prev) =>
                        e.target.checked ? [...new Set([...prev, p])] : prev.filter((x) => x !== p)
                      )
                    }
                  />
                  {permLabels[p] ?? p}
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">
            Outlet Access
          </span>
          <div className="space-y-1">
            {outlets.map((o) => (
              <label key={o._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={outletIds.includes(o._id)}
                  onChange={(e) =>
                    setOutletIds((prev) =>
                      e.target.checked ? [...prev, o._id] : prev.filter((id) => id !== o._id)
                    )
                  }
                />
                {o.name}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={saving} onClick={save}>
          {saving ? "Creating..." : "Create User"}
        </Button>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  async function reset() {
    if (!user || password.length < 6) return;
    const res = await apiAuth(`/admin/users/${user._id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (res.success) {
      setDone(true);
      setPassword("");
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1200);
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Reset Password — ${user?.username ?? ""}`}>
      <div className="space-y-3">
        <Input
          type="password"
          placeholder="New password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="w-full" onClick={reset} disabled={password.length < 6}>
          {done ? "Password Updated" : "Reset Password"}
        </Button>
      </div>
    </Modal>
  );
}
