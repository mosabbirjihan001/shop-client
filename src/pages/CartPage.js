import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { addOrder } from "../utils/orderStore";
import { getPaymentMethod, PAYMENT_METHODS, normalizePaymentMethod } from "../utils/paymentMethods";

const COUPON_KEY = "shopapp_coupons";
const PROFILE_KEY = "shopapp_profile";

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard delivery", price: 0, eta: "2-4 business days" },
  { id: "express", label: "Express delivery", price: 8, eta: "Next business day in city areas" },
  { id: "pickup", label: "Store pickup", price: 0, eta: "Ready after confirmation" },
];

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const savedProfile = user ? readStorage(PROFILE_KEY, {})[user.email] || {} : {};
  const [paymentMethodId, setPaymentMethodId] = useState(normalizePaymentMethod(savedProfile.payment_method));
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAcknowledged, setPaymentAcknowledged] = useState(false);
  const [deliveryOptionId, setDeliveryOptionId] = useState("standard");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [customer, setCustomer] = useState({
    name: savedProfile.full_name || "",
    phone: savedProfile.phone || "",
    address: savedProfile.address || "",
  });
  const selectedPayment = getPaymentMethod(paymentMethodId);
  const selectedDelivery = DELIVERY_OPTIONS.find((option) => option.id === deliveryOptionId) || DELIVERY_OPTIONS[0];
  const shipping = subtotal > 0 ? selectedDelivery.price : 0;
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      return Math.min(subtotal, subtotal * (Number(appliedCoupon.value) / 100));
    }
    return Math.min(subtotal, Number(appliedCoupon.value || 0));
  }, [appliedCoupon, subtotal]);
  const total = Math.max(0, subtotal + shipping - discount);

  const updateCustomer = (key, value) => {
    setCustomer((current) => ({ ...current, [key]: value }));
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const coupons = readStorage(COUPON_KEY, []);
    const coupon = coupons.find((item) => item.code === code && item.active);
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMessage("Coupon not found or inactive.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponMessage(`Coupon ${coupon.code} applied.`);
  };

  const checkout = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setCheckoutMessage("");

    if (!customer.phone.trim()) {
      setCheckoutMessage("Phone number is required for order confirmation.");
      return;
    }

    if (deliveryOptionId !== "pickup" && !customer.address.trim()) {
      setCheckoutMessage("Delivery address is required for home delivery.");
      return;
    }

    if (selectedPayment.requiresReference && !paymentReference.trim()) {
      setCheckoutMessage(`${selectedPayment.shortLabel} transaction/reference number is required.`);
      return;
    }

    if (selectedPayment.type !== "offline" && !paymentAcknowledged) {
      setCheckoutMessage("Please confirm that payment details were completed only through the official provider.");
      return;
    }

    const orderId = `TM-${Date.now()}`;
    const paymentReceived = selectedPayment.status === "paid" || Boolean(paymentReference.trim());
    const order = {
      id: orderId,
      date: new Date().toISOString(),
      userEmail: user.email,
      customerName: customer.name || user.email,
      customerPhone: customer.phone,
      items: items.map((item) => ({ ...item })),
      subtotal,
      shipping,
      discount,
      total,
      couponCode: appliedCoupon?.code || "",
      paymentMethod: selectedPayment.label,
      paymentProvider: selectedPayment.id,
      paymentReference: paymentReference.trim(),
      paymentStatus: paymentReceived ? "paid" : selectedPayment.status,
      paymentReceived,
      paymentRisk: selectedPayment.requiresReference && paymentReference.trim().length < 8 ? "review" : "normal",
      deliveryMethod: selectedDelivery.label,
      deliveryEta: selectedDelivery.eta,
      deliveryAddress: deliveryOptionId === "pickup" ? "Store pickup" : customer.address,
      delivered: false,
      approvalStatus: "pending",
      orderStatus: "pending",
    };
    const result = await addOrder(order);
    alert(`Order ${result.order.id} placed. Payment status: ${result.order.paymentStatus.replaceAll("_", " ")}.${result.source === "local" ? " Saved locally because the server order table is not available." : ""}`);
    clearCart();
    setAppliedCoupon(null);
    setCouponCode("");
    setPaymentReference("");
    setPaymentAcknowledged(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Shopping cart</h1>
      {items.length === 0 ? (
        <div className="mt-6 rounded-md border border-base-300 bg-base-100 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold">Your cart is empty</h2>
          <p className="mt-2 text-base-content/60">Add products from the shop or buy now from a product page.</p>
          <Link to="/" className="btn btn-warning mt-6">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-md border border-base-300 bg-base-100 p-4 shadow-sm md:grid-cols-[120px_1fr_auto]">
                <Link to={`/product/${item.id}`} className="h-28 overflow-hidden rounded-md bg-base-200">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-base-content/40">No image</div>
                  )}
                </Link>
                <div>
                  <Link to={`/product/${item.id}`} className="font-bold hover:text-primary">{item.name}</Link>
                  <p className={`mt-1 text-sm ${item.stock_quantity == null || Number(item.stock_quantity || 0) > 0 ? "text-success" : "text-error"}`}>
                    {item.stock_quantity == null ? "In stock" : Number(item.stock_quantity || 0) > 0 ? `${item.stock_quantity} available` : "Out of stock"}
                  </p>
                  <button className="btn btn-ghost btn-xs mt-3" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
                <div className="min-w-36">
                  <div className="font-bold text-error">${Number(item.price || 0).toFixed(2)}</div>
                  <label className="form-control mt-3">
                    <span className="label-text mb-1">Qty</span>
                    <input
                      className="input input-bordered input-sm"
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                    />
                  </label>
                </div>
              </article>
            ))}
          </section>
          <aside className="h-fit rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
              <div className="divider my-2"></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4">
              {checkoutMessage && <div className="alert alert-warning mb-4 text-sm">{checkoutMessage}</div>}
              <div className="mb-4 grid gap-3">
                <label className="form-control">
                  <span className="label-text mb-2">Contact name</span>
                  <input className="input input-bordered" value={customer.name}
                    onChange={(event) => updateCustomer("name", event.target.value)} placeholder="Customer name" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-2">Phone number</span>
                  <input className="input input-bordered" value={customer.phone}
                    onChange={(event) => updateCustomer("phone", event.target.value)} placeholder="+880..." />
                </label>
                <label className="form-control">
                  <span className="label-text mb-2">Delivery address</span>
                  <textarea className="textarea textarea-bordered min-h-20" value={customer.address}
                    onChange={(event) => updateCustomer("address", event.target.value)} placeholder="House, road, area, city" />
                </label>
              </div>
              <label className="form-control mb-4">
                <span className="label-text mb-2">Delivery option</span>
                <select className="select select-bordered" value={deliveryOptionId}
                  onChange={(event) => setDeliveryOptionId(event.target.value)}>
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} {option.price ? `- $${option.price}` : "- Free"}
                    </option>
                  ))}
                </select>
                <span className="mt-1 text-xs text-base-content/60">{selectedDelivery.eta}</span>
              </label>
              <div className="mb-4">
                <span className="label-text mb-2 block">Secure payment</span>
                <div className="grid gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label key={method.id} className={`cursor-pointer rounded-md border p-3 text-sm transition ${paymentMethodId === method.id ? "border-warning bg-warning/10" : "border-base-300 bg-base-100"}`}>
                      <input
                        className="radio radio-warning radio-sm mr-2 align-middle"
                        type="radio"
                        checked={paymentMethodId === method.id}
                        onChange={() => {
                          setPaymentMethodId(method.id);
                          setPaymentReference("");
                          setPaymentAcknowledged(false);
                        }}
                      />
                      <span className="font-semibold">{method.label}</span>
                      <span className="mt-1 block text-xs text-base-content/60">{method.secureNote}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-base-content/70">
                  This checkout never asks for card numbers, PINs, OTPs, or wallet passwords. Admin only sees order details and payment references.
                </div>
              </div>
              {selectedPayment.requiresReference && (
                <label className="form-control mb-4">
                  <span className="label-text mb-2">Payment reference / transaction ID</span>
                  <input className="input input-bordered uppercase" value={paymentReference}
                    autoComplete="off"
                    inputMode="text"
                    onChange={(event) => setPaymentReference(event.target.value.replace(/\s/g, ""))}
                    placeholder="TRX123456789" />
                </label>
              )}
              {selectedPayment.type !== "offline" && (
                <label className="label mb-4 cursor-pointer justify-start gap-3 rounded-md border border-base-300 p-3">
                  <input className="checkbox checkbox-warning" type="checkbox" checked={paymentAcknowledged} onChange={(event) => setPaymentAcknowledged(event.target.checked)} />
                  <span className="label-text">I completed payment through the official provider and did not enter sensitive payment data here.</span>
                </label>
              )}
              <label className="form-control">
                <span className="label-text mb-2">Discount coupon</span>
                <div className="join">
                  <input className="input input-bordered join-item w-full uppercase" value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)} placeholder="SAVE10" />
                  <button className="btn btn-primary join-item" type="button" onClick={applyCoupon}>Apply</button>
                </div>
              </label>
              {couponMessage && <p className="mt-2 text-xs text-base-content/60">{couponMessage}</p>}
            </div>
            <button className="btn btn-warning mt-5 w-full" onClick={checkout}>Buy now</button>
            <Link to="/" className="btn btn-ghost mt-2 w-full">Keep shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
