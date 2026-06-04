import { ContactForm } from "@/components/contact/contact-form";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-[#8b1a1a]">Contact Us</h1>
      <p className="mt-2 text-[#5c4a3a]">We&apos;d love to hear from you</p>
      <ContactForm />
    </div>
  );
}
