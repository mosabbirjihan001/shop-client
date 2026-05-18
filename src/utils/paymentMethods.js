export const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on delivery",
    shortLabel: "COD",
    type: "offline",
    status: "pending_collection",
    note: "Pay the delivery agent after checking the package.",
    requiresReference: false,
    secureNote: "No online payment data is collected for COD.",
  },
  {
    id: "card_gateway",
    label: "Credit/debit card",
    shortLabel: "Card",
    type: "gateway",
    status: "pending_gateway",
    note: "Use a secure hosted card gateway. Card numbers are never saved in this app.",
    requiresReference: false,
    secureNote: "Card details must be entered only on your payment gateway, never in this store form.",
  },
  {
    id: "bkash",
    label: "bKash",
    shortLabel: "bKash",
    type: "mobile_banking",
    status: "pending_verification",
    note: "Send payment to merchant wallet 01XXXXXXXXX, then enter the transaction ID.",
    requiresReference: true,
    secureNote: "Only the transaction ID is saved for admin verification.",
  },
  {
    id: "nagad",
    label: "Nagad",
    shortLabel: "Nagad",
    type: "mobile_banking",
    status: "pending_verification",
    note: "Send payment to merchant wallet 01XXXXXXXXX, then enter the transaction ID.",
    requiresReference: true,
    secureNote: "Only the transaction ID is saved for admin verification.",
  },
  {
    id: "rocket",
    label: "Rocket",
    shortLabel: "Rocket",
    type: "mobile_banking",
    status: "pending_verification",
    note: "Send payment to merchant wallet 01XXXXXXXXX, then enter the transaction ID.",
    requiresReference: true,
    secureNote: "Only the transaction ID is saved for admin verification.",
  },
  {
    id: "bank_transfer",
    label: "Bank transfer",
    shortLabel: "Bank",
    type: "bank",
    status: "pending_verification",
    note: "Transfer to the shop account and enter the bank reference number.",
    requiresReference: true,
    secureNote: "Bank references are reviewed by admin before fulfillment.",
  },
  {
    id: "emi",
    label: "Card EMI / installment",
    shortLabel: "EMI",
    type: "gateway",
    status: "pending_gateway",
    note: "Choose EMI on the secure card gateway when the order is confirmed.",
    requiresReference: false,
    secureNote: "Installment approval happens outside this app through your payment provider.",
  },
];

const LEGACY_PAYMENT_MAP = {
  "Cash on delivery": "cod",
  "Card on delivery": "card_gateway",
  "Mobile banking": "bkash",
};

export function normalizePaymentMethod(value) {
  if (!value) return "cod";
  return PAYMENT_METHODS.some((method) => method.id === value)
    ? value
    : LEGACY_PAYMENT_MAP[value] || "cod";
}

export function getPaymentMethod(value) {
  const id = normalizePaymentMethod(value);
  return PAYMENT_METHODS.find((method) => method.id === id) || PAYMENT_METHODS[0];
}

export function getPaymentStatusLabel(status) {
  const labels = {
    pending_collection: "Pending cash collection",
    pending_gateway: "Pending gateway payment",
    pending_verification: "Pending payment verification",
    paid: "Paid",
  };
  return labels[status] || "Pending";
}
