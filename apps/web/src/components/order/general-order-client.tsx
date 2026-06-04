"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, UtensilsCrossed, Package, CheckCircle2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuItemGrid, type MenuItemDisplay } from "@/components/menu/menu-item-grid";
import { cn } from "@/lib/utils";
import { apiPublic } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { OrderType, PaymentMethod } from "@anilji/shared";

interface MenuItemT {
  _id: string;
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  imageUrl?: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PlacedOrder {
  _id: string;
  status: string;
  paymentStatus: string;
  total: number;
  orderType: string;
}

interface OfferT {
  _id: string;
  title: string;
  description?: string;
  discountType: string;
  value: number;
  isExclusive?: boolean;
}

interface Props {
  outletSlug: string;
  categories: { _id: string; name: string; slug: string }[];
  items: MenuItemT[];
  table?: { slug: string; tableNumber: number };
  outletName?: string;
}

function calcDiscount(subtotal: number, offer: OfferT | null): number {
  if (!offer) return 0;
  if (offer.discountType === "PERCENTAGE") return Math.round((subtotal * offer.value) / 100);
  return Math.min(subtotal, offer.value);
}

const STATUS_STEPS = ["NEW", "PREPARING", "READY", "DELIVERED", "COMPLETED"];

export function GeneralOrderClient({ outletSlug, categories, items, table, outletName }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [step, setStep] = useState<"menu" | "checkout" | "tracking">("menu");
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [generalOffers, setGeneralOffers] = useState<OfferT[]>([]);
  const [selectedGeneralOfferId, setSelectedGeneralOfferId] = useState<string>("");
  const [exclusiveCode, setExclusiveCode] = useState("");
  const [validatedExclusive, setValidatedExclusive] = useState<OfferT | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState("");

  const itemsByCat = useMemo(() => {
    if (activeCat === "all") return items;
    return items.filter((i) => String(i.categoryId) === activeCat);
  }, [items, activeCat]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const selectedOffer =
    validatedExclusive ?? generalOffers.find((o) => o._id === selectedGeneralOfferId) ?? null;
  const discount = calcDiscount(subtotal, selectedOffer);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = Math.round(afterDiscount * 0.05);
  const total = afterDiscount + tax;
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);

  useEffect(() => {
    if (step !== "checkout") return;
    apiPublic<OfferT[]>(`/public/offers/${outletSlug}`).then((res) => {
      if (res.success && res.data) setGeneralOffers(res.data);
    });
  }, [step, outletSlug]);

  useEffect(() => {
    if (step === "checkout" && totalQty === 0) {
      setStep("menu");
      setError("");
    }
  }, [step, totalQty]);

  async function applyExclusiveCode() {
    setOfferMessage("");
    if (!exclusiveCode.trim()) {
      setOfferMessage("Enter an offer code.");
      return;
    }
    const res = await apiPublic<OfferT>(`/public/offers/${outletSlug}/validate-code`, {
      method: "POST",
      body: JSON.stringify({ code: exclusiveCode.trim() }),
    });
    if (res.success && res.data) {
      setValidatedExclusive(res.data);
      setSelectedGeneralOfferId("");
      setOfferMessage(`Applied: ${res.data.title}`);
    } else {
      setValidatedExclusive(null);
      setOfferMessage(res.message ?? "Invalid offer code");
    }
  }

  useEffect(() => {
    if (!order) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("join:order", order._id);
    const handler = (data: { status?: string; paymentStatus?: string }) => {
      setOrder((o) =>
        o ? { ...o, status: data.status ?? o.status, paymentStatus: data.paymentStatus ?? o.paymentStatus } : o
      );
    };
    const events = ["order:preparing", "order:ready", "order:delivered", "order:completed", "payment:completed"];
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?._id]);

  function addItem(item: MenuItemDisplay) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item._id);
      if (existing) {
        return prev.map((c) => (c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function qtyOf(id: string) {
    return cart.find((c) => c.menuItemId === id)?.quantity ?? 0;
  }

  function goToCheckout() {
    if (totalQty === 0 || subtotal <= 0) {
      setError("Add at least one item to your cart.");
      return;
    }
    setError("");
    setStep("checkout");
  }

  async function placeOrder(method: PaymentMethod) {
    setError("");
    if (totalQty === 0 || subtotal <= 0) {
      setError("Your cart is empty. Add items before placing an order.");
      setStep("menu");
      return;
    }
    if (orderType === OrderType.TAKEAWAY && (!name.trim() || !phone.trim())) {
      setError("Please enter your name and phone for takeaway orders.");
      return;
    }
    setLoading(true);
    const res = await apiPublic<PlacedOrder>("/public/orders", {
      method: "POST",
      body: JSON.stringify({
        outletSlug,
        tableSlug: table?.slug,
        orderType: table ? OrderType.DINE_IN : orderType,
        customerName: name || undefined,
        customerPhone: phone || undefined,
        customerEmail: email.trim() || undefined,
        notes: notes || undefined,
        offerId: selectedOffer?._id || undefined,
        items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        paymentMethod: method,
      }),
    });
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "Could not place order. Please try again.");
      return;
    }
    setOrder(res.data);
    setStep("tracking");
    if (method === PaymentMethod.RAZORPAY) {
      await handleRazorpay(res.data._id);
    }
  }

  async function handleRazorpay(orderId: string) {
    const createRes = await apiPublic<{ razorpayOrderId: string; amount: number; keyId: string }>(
      "/public/payments/razorpay/create-order",
      { method: "POST", body: JSON.stringify({ orderId }) }
    );
    if (!createRes.success || !createRes.data) return;
    const { razorpayOrderId, amount, keyId } = createRes.data;

    await new Promise<void>((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve();
      const s = document.createElement("script");
      s.id = "razorpay-script";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      document.body.appendChild(s);
    });

    const RZP = (window as unknown as { Razorpay?: new (o: unknown) => { open: () => void } }).Razorpay;
    if (!RZP) return;
    const rzp = new RZP({
      key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency: "INR",
      name: "Anil Ji Chaat",
      description: orderType === OrderType.TAKEAWAY ? "Takeaway Order" : "Dine-In Order",
      order_id: razorpayOrderId,
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        await apiPublic("/public/payments/razorpay/verify", {
          method: "POST",
          body: JSON.stringify({ orderId, ...response }),
        });
        setOrder((o) => (o ? { ...o, paymentStatus: "PAID" } : o));
      },
      theme: { color: "#8b1a1a" },
    });
    rzp.open();
  }

  if (step === "tracking" && order) {
    const stepIdx = STATUS_STEPS.indexOf(order.status);
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-[#e8dcc8] bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
          <h1 className="mt-4 font-brand text-2xl font-extrabold text-[#8b1a1a]">Order Placed!</h1>
          <p className="mt-1 text-sm text-[#5c4a3a]">
            #{order._id.slice(-6).toUpperCase()} ·{" "}
            {order.orderType === OrderType.TAKEAWAY ? "Takeaway" : "Dine-In"}
          </p>

          <div className="mt-6 flex items-center justify-between">
            {STATUS_STEPS.slice(0, 4).map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    i <= stepIdx ? "bg-[#8b1a1a] text-white" : "bg-[#f0e6d8] text-[#b6a48f]"
                  )}
                >
                  {i + 1}
                </div>
                <span className="mt-1 text-[10px] font-medium text-[#5c4a3a]">{s}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-1 rounded-xl bg-[#fbf3e8] p-4 text-left text-sm">
            <p>Status: <strong>{order.status}</strong></p>
            <p>
              Payment:{" "}
              <strong className={order.paymentStatus === "PAID" ? "text-green-700" : "text-amber-700"}>
                {order.paymentStatus}
              </strong>
            </p>
            <p>Total: <strong>₹{order.total}</strong></p>
          </div>

          <Button
            className="mt-6 w-full"
            variant="outline"
            onClick={() => {
              setOrder(null);
              setCart([]);
              setStep("menu");
            }}
          >
            Place Another Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
      <div className="flex flex-col gap-1">
        <h1 className="font-brand text-3xl font-extrabold text-[#8b1a1a]">
          {table ? `${outletName ?? "Anil Ji Chaat"} — Table ${table.tableNumber}` : "Order Online"}
        </h1>
        <p className="text-sm text-[#5c4a3a]">
          {table ? "Scan & order · Fresh chaat at your table" : "Fresh chaat made to order · Dine-in or Takeaway"}
        </p>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip key={c._id} active={activeCat === c._id} onClick={() => setActiveCat(c._id)}>
            {c.name}
          </Chip>
        ))}
      </div>

      {step === "menu" && (
        <div className="mt-6">
          <MenuItemGrid
            items={itemsByCat}
            getQty={qtyOf}
            onAdd={addItem}
            onChangeQty={changeQty}
            imageHeightClass="h-52"
          />
        </div>
      )}

      {step === "checkout" && totalQty > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
            {!table && (
              <>
                <h2 className="font-semibold text-[#3d2914]">How would you like it?</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <OrderTypeCard
                    active={orderType === OrderType.DINE_IN}
                    onClick={() => setOrderType(OrderType.DINE_IN)}
                    icon={<UtensilsCrossed className="h-5 w-5" />}
                    label="Dine In"
                  />
                  <OrderTypeCard
                    active={orderType === OrderType.TAKEAWAY}
                    onClick={() => setOrderType(OrderType.TAKEAWAY)}
                    icon={<Package className="h-5 w-5" />}
                    label="Takeaway"
                  />
                </div>
              </>
            )}

            <div className="mt-4 space-y-3">
              <Input
                placeholder={orderType === OrderType.TAKEAWAY ? "Your name (required)" : "Your name (optional)"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder={orderType === OrderType.TAKEAWAY ? "Phone (required)" : "Phone (optional)"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email (optional — for order receipt)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <textarea
                placeholder="Any notes for the kitchen? (e.g. less spicy)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
            <h2 className="font-semibold text-[#3d2914]">Your Order</h2>
            <div className="mt-3 space-y-3">
              {cart.map((c) => (
                <div key={c.menuItemId} className="flex items-center justify-between text-sm">
                  <span className="flex-1">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <button className="rounded bg-[#f0e6d8] px-2" onClick={() => changeQty(c.menuItemId, -1)}>
                      −
                    </button>
                    <span>{c.quantity}</span>
                    <button className="rounded bg-[#f0e6d8] px-2" onClick={() => changeQty(c.menuItemId, 1)}>
                      +
                    </button>
                    <span className="w-14 text-right font-medium">₹{c.price * c.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-dashed border-[#e8dcc8] pt-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#3d2914]">
                <Tag className="h-4 w-4 text-[#e0892a]" /> Apply Offer
              </h3>

              {generalOffers.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-medium text-[#9a8b7a]">General offers</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e8dcc8] p-2 text-sm">
                    <input
                      type="radio"
                      name="offer"
                      checked={!selectedGeneralOfferId && !validatedExclusive}
                      onChange={() => {
                        setSelectedGeneralOfferId("");
                        setValidatedExclusive(null);
                        setOfferMessage("");
                      }}
                    />
                    No offer
                  </label>
                  {generalOffers.map((o) => (
                    <label
                      key={o._id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm",
                        selectedGeneralOfferId === o._id && !validatedExclusive
                          ? "border-[#8b1a1a] bg-[#fbf3e8]"
                          : "border-[#e8dcc8]"
                      )}
                    >
                      <input
                        type="radio"
                        name="offer"
                        checked={selectedGeneralOfferId === o._id && !validatedExclusive}
                        onChange={() => {
                          setSelectedGeneralOfferId(o._id);
                          setValidatedExclusive(null);
                          setExclusiveCode("");
                          setOfferMessage("");
                        }}
                        className="mt-1"
                      />
                      <span>
                        <strong>{o.title}</strong>
                        <br />
                        <span className="text-[#5c4a3a]">
                          {o.discountType === "PERCENTAGE" ? `${o.value}% off` : `₹${o.value} off`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-medium text-[#9a8b7a]">Exclusive offer code</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Enter code (e.g. VIP20)"
                    value={exclusiveCode}
                    onChange={(e) => setExclusiveCode(e.target.value.toUpperCase())}
                  />
                  <Button type="button" variant="secondary" onClick={applyExclusiveCode}>
                    Apply
                  </Button>
                </div>
                {validatedExclusive && (
                  <p className="mt-2 text-xs font-medium text-green-700">
                    ✓ {validatedExclusive.title} applied
                  </p>
                )}
                {offerMessage && !validatedExclusive && (
                  <p className="mt-1 text-xs text-red-600">{offerMessage}</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1 border-t border-dashed border-[#e8dcc8] pt-4 text-sm">
              <Row label="Subtotal" value={`₹${subtotal}`} />
              {discount > 0 && <Row label="Discount" value={`−₹${discount}`} />}
              <Row label="Tax (5%)" value={`₹${tax}`} />
              <div className="flex justify-between pt-1 text-base font-bold text-[#8b1a1a]">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex flex-col gap-3">
              <Button
                disabled={loading || totalQty === 0}
                onClick={() => placeOrder(PaymentMethod.RAZORPAY)}
                className="gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Pay Online (₹{total})
              </Button>
              <Button
                disabled={loading || totalQty === 0}
                variant="secondary"
                onClick={() => placeOrder(PaymentMethod.CASH)}
              >
                Pay at Counter
              </Button>
              <Button variant="ghost" onClick={() => setStep("menu")}>
                Add More Items
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky cart bar */}
      <AnimatePresence>
        {cart.length > 0 && step === "menu" && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8dcc8] bg-white/95 p-3 backdrop-blur"
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <button
                type="button"
                onClick={goToCheckout}
                className="flex items-center gap-2 text-sm font-medium text-[#5c4a3a]"
              >
                <span className="relative">
                  <ShoppingBag className="h-6 w-6 text-[#8b1a1a]" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e0892a] text-[10px] font-bold text-white">
                    {totalQty}
                  </span>
                </span>
                <span className="font-semibold text-[#8b1a1a]">₹{total}</span>
              </button>
              <Button className="rounded-full" onClick={goToCheckout}>
                Checkout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-[#8b1a1a] text-white" : "bg-[#f5e6d3] text-[#5c4a3a] hover:bg-[#ebd4b8]"
      )}
    >
      {children}
    </button>
  );
}

function OrderTypeCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-colors",
        active ? "border-[#8b1a1a] bg-[#fbf3e8] text-[#8b1a1a]" : "border-[#e8dcc8] text-[#5c4a3a]"
      )}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[#5c4a3a]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
