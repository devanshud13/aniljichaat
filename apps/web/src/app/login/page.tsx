"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiAuth } from "@/lib/api";
import { Role } from "@anilji/shared";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await apiAuth<{ user: { role: string; permissions?: string[] } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: fd.get("username"),
        password: fd.get("password"),
      }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.message ?? "Login failed");
      return;
    }
    const role = res.data?.user.role;
    if (role === Role.KITCHEN) router.push("/admin/kitchen");
    else if (role === Role.MANAGER) router.push("/admin/manager");
    else if (role === Role.ADMIN) router.push("/admin");
    else router.push("/admin");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <h1 className="font-serif text-3xl font-bold text-center text-[#8b1a1a]">Staff Login</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input name="username" placeholder="Username" required autoComplete="username" />
        <Input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
