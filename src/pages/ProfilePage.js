import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { getPaymentMethod, normalizePaymentMethod, PAYMENT_METHODS } from "../utils/paymentMethods";

const THEMES = ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave"];
const PROFILE_KEY = "shopapp_profile";

function readLocalProfile(email) {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    return profiles[email] || {};
  } catch {
    return {};
  }
}

function writeLocalProfile(email, profile) {
  let profiles = {};
  try {
    profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") || {};
  } catch {
    profiles = {};
  }
  profiles[email] = profile;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

async function upsertProfileBasics(user, fullName, role) {
  const attempts = [
    { id: user.id, email: user.email, full_name: fullName, role },
    { id: user.id, email: user.email, role },
    { id: user.id, email: user.email },
    { id: user.id },
  ];
  let lastError = null;

  for (const payload of attempts) {
    const { error } = await supabase.from("profiles").upsert(payload);
    if (!error) return null;
    lastError = error;
    if (!/column|schema|cache/i.test(error.message || "")) return error;
  }

  return lastError;
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const localProfile = readLocalProfile(user?.email);
  const [form, setForm] = useState({
    full_name: localProfile.full_name || "",
    avatar_url: localProfile.avatar_url || "",
    phone: localProfile.phone || "",
    address: localProfile.address || "",
    payment_method: normalizePaymentMethod(localProfile.payment_method),
    theme: localProfile.theme || localStorage.getItem("shopapp_theme") || "light",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readLocalProfile(user?.email);
    setForm({
      full_name: saved.full_name || profile?.full_name || user?.user_metadata?.full_name || "",
      avatar_url: saved.avatar_url || profile?.avatar_url || user?.user_metadata?.avatar_url || "",
      phone: saved.phone || "",
      address: saved.address || "",
      payment_method: normalizePaymentMethod(saved.payment_method),
      theme: saved.theme || profile?.theme || localStorage.getItem("shopapp_theme") || "light",
    });
  }, [profile, user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", form.theme);
    localStorage.setItem("shopapp_theme", form.theme);
  }, [form.theme]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const localPayload = {
      ...form,
      email: user.email,
    };
    writeLocalProfile(user.email, localPayload);

    const error = await upsertProfileBasics(user, form.full_name, profile?.role || "user");

    if (!error) {
      await refreshProfile();
      setMessage("Profile saved.");
    } else {
      setMessage("Profile saved locally. Supabase profile table does not have every optional column yet.");
    }
    setLoading(false);
  };

  const initial = (form.full_name || user?.email || "U").charAt(0).toUpperCase();
  const selectedPayment = getPaymentMethod(form.payment_method);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Your profile</h1>
      <p className="mt-1 text-base-content/60">Manage your display name, picture, delivery info, payment preference, and theme.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-md border border-base-300 bg-base-100 p-5 text-center shadow-sm">
          <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-primary text-primary-content">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt={form.full_name || user.email} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-4xl font-bold">{initial}</div>
            )}
          </div>
          <h2 className="mt-4 text-xl font-bold">{form.full_name || "ShopApp user"}</h2>
          <p className="text-sm text-base-content/60">{user.email}</p>
          <span className="badge badge-primary mt-3">{profile?.role || "user"}</span>
          <div className="mt-4 rounded-md bg-base-200 p-3 text-left text-sm">
            <div className="font-semibold">Default payment</div>
            <div className="text-base-content/60">{selectedPayment.label}</div>
          </div>
        </aside>

        <form onSubmit={saveProfile} className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
          {message && <div className="alert alert-info mb-4 text-sm">{message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-2">Display name</span>
              <input className="input input-bordered" value={form.full_name}
                onChange={(event) => updateForm("full_name", event.target.value)} placeholder="Your name" />
            </label>
            <label className="form-control">
              <span className="label-text mb-2">Phone</span>
              <input className="input input-bordered" value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)} placeholder="+880..." />
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-2">Profile picture URL</span>
              <input className="input input-bordered" value={form.avatar_url}
                onChange={(event) => updateForm("avatar_url", event.target.value)} placeholder="https://example.com/avatar.jpg" />
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-2">Delivery address</span>
              <textarea className="textarea textarea-bordered min-h-24" value={form.address}
                onChange={(event) => updateForm("address", event.target.value)} placeholder="House, road, area, city" />
            </label>
            <label className="form-control">
              <span className="label-text mb-2">Preferred payment method</span>
              <select className="select select-bordered" value={form.payment_method}
                onChange={(event) => updateForm("payment_method", event.target.value)}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>{method.label}</option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-2">Theme</span>
              <select className="select select-bordered" value={form.theme}
                onChange={(event) => updateForm("theme", event.target.value)}>
                {THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
              </select>
            </label>
          </div>
          <button className="btn btn-primary mt-5" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm"></span> : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
