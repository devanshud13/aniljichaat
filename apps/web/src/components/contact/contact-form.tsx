"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPublic } from "@/lib/api";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const res = await apiPublic("/public/contact", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        message: fd.get("message"),
      }),
    });
    setStatus(res.success ? "success" : "error");
    if (res.success) e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Input name="name" placeholder="Name" required />
      <Input name="phone" placeholder="Phone" required />
      <Input name="email" type="email" placeholder="Email" required />
      <textarea
        name="message"
        placeholder="Message"
        required
        rows={5}
        className="flex w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send Message"}
      </Button>
      {status === "success" && <p className="text-green-700">Message sent!</p>}
      {status === "error" && <p className="text-red-700">Failed to send. Try again.</p>}
    </form>
  );
}
