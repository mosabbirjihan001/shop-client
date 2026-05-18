import { apiUrl } from "../config";

export const ORDERS_KEY = "shopapp_sales";
const ORDERS_API = apiUrl("/api/orders");

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Request failed with status ${response.status}`);
  return body;
}

function normalizeOrder(order) {
  const paymentReceived = Boolean(order.paymentReceived);
  const delivered = Boolean(order.delivered);
  return {
    ...order,
    id: order.id || `TM-${Date.now()}`,
    date: order.date || new Date().toISOString(),
    approvalStatus: order.approvalStatus || "pending",
    paymentReceived,
    delivered,
    paymentStatus: paymentReceived ? "paid" : order.paymentStatus || "pending",
    orderStatus: delivered ? "delivered" : order.orderStatus || "pending",
    paymentRisk: order.paymentRisk || "normal",
    trackingNumber: order.trackingNumber || "",
    adminNote: order.adminNote || "",
  };
}

export function getLocalOrders() {
  return readJson(ORDERS_KEY, []).map(normalizeOrder);
}

export function saveLocalOrders(orders) {
  writeJson(ORDERS_KEY, orders.map(normalizeOrder));
}

export async function listOrders() {
  try {
    const orders = await requestJson(ORDERS_API);
    if (Array.isArray(orders)) {
      return { data: orders.map(normalizeOrder), source: "api", error: null };
    }
  } catch (error) {
    return { data: getLocalOrders(), source: "local", error };
  }

  return { data: getLocalOrders(), source: "local", error: null };
}

export async function addOrder(order) {
  const payload = normalizeOrder(order);
  try {
    const response = await requestJson(ORDERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { order: normalizeOrder(response.result || payload), source: "api", error: null };
  } catch (error) {
    const orders = getLocalOrders();
    saveLocalOrders([...orders, payload]);
    return { order: payload, source: "local", error };
  }
}

export async function updateOrder(order) {
  const payload = normalizeOrder(order);

  try {
    const response = await requestJson(`${ORDERS_API}/${payload.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { order: normalizeOrder(response.result || payload), source: "api", error: null };
  } catch (error) {
    const orders = getLocalOrders().map((item) => String(item.id) === String(payload.id) ? payload : item);
    saveLocalOrders(orders);
    return { order: payload, source: "local", error };
  }
}
