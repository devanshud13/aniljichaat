"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPublic } from "@/lib/api";

export default function PartnershipsPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const res = await apiPublic("/public/partnerships", {
      method: "POST",
      body: JSON.stringify({
        companyName: fd.get("companyName"),
        contactName: fd.get("contactName"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        message: fd.get("message"),
      }),
    });
    setStatus(res.success ? "success" : "error");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-[#8b1a1a]">Brand Partnerships</h1>
      <p className="mt-2 text-[#5c4a3a]">Collaborate with Anil Ji Chaat</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input name="companyName" placeholder="Company Name" required />
        <Input name="contactName" placeholder="Contact Name" required />
        <Input name="phone" placeholder="Phone" required />
        <Input name="email" type="email" placeholder="Email" required />
        <textarea
          name="message"
          placeholder="Tell us about your partnership idea"
          required
          rows={5}
          className="flex w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={status === "loading"}>
          Submit Inquiry
        </Button>
        {status === "success" && <p className="text-green-700">Thank you! We&apos;ll be in touch.</p>}
      </form>
    </div>
  );
}
