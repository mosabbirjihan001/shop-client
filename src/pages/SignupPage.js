import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const PROFILE_KEY = "shopapp_profile";
const SIGNUP_COOLDOWN_KEY = "shopapp_signup_cooldowns";
const RATE_LIMIT_WAIT_MS = 90 * 1000;

function readProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLocalProfile(email, profile) {
  if (!email) return;
  const profiles = readProfiles();
  profiles[email] = { ...(profiles[email] || {}), ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function readSignupCooldown(email) {
  try {
    const cooldowns = JSON.parse(localStorage.getItem(SIGNUP_COOLDOWN_KEY)) || {};
    return Number(cooldowns[email?.toLowerCase()] || 0);
  } catch {
    return 0;
  }
}

function writeSignupCooldown(email, until) {
  if (!email) return;
  try {
    const cooldowns = JSON.parse(localStorage.getItem(SIGNUP_COOLDOWN_KEY) || "{}") || {};
    cooldowns[email.toLowerCase()] = until;
    localStorage.setItem(SIGNUP_COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch {
    // Ignore storage failures; the visible message still guides the user.
  }
}

function isRateLimitError(error) {
  return /rate limit|too many|email rate/i.test(error?.message || "");
}

async function upsertSignupProfile(user, email, fullName) {
  if (!user?.id) return null;

  const attempts = [
    { id: user.id, email, full_name: fullName, role: "user" },
    { id: user.id, email, role: "user" },
    { id: user.id, email },
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

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState("light");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const { signup } = useAuth();

  useEffect(() => {
    if (!cooldownUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    setCooldownUntil(readSignupCooldown(email));
  }, [email]);

  const cooldownSeconds = useMemo(
    () => Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    [cooldownUntil, now]
  );

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (cooldownSeconds > 0) {
      setMessageType("info");
      setMessage(`Supabase email service is cooling down. Try this email again in ${cooldownSeconds} seconds, or log in if the account was already created.`);
      return;
    }

    setLoading(true);
    const { data, error, source } = await signup(email, password, {
      data: { full_name: fullName },
    });
    if (error) {
      setLoading(false);
      if (isRateLimitError(error)) {
        const until = Date.now() + RATE_LIMIT_WAIT_MS;
        writeSignupCooldown(email, until);
        setCooldownUntil(until);
        setMessageType("info");
        setMessage("The email service is busy right now. I paused this signup for 90 seconds so it does not keep failing. Try again shortly, or log in if this account already exists.");
      } else {
        setMessageType("error");
        setMessage(error.message);
      }
    } else {
      if (data.user) {
        writeLocalProfile(email, {
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          theme,
          role: "user",
        });

        await upsertSignupProfile(data.user, email, fullName);
      }
      setLoading(false);
      setMessageType("success");
      setMessage(source === "api"
        ? "Account created. You can log in now."
        : "Account created. Check your email if confirmation is required, then log in."
      );
      setFullName("");
      setEmail("");
      setAvatarUrl("");
      setTheme("light");
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-10">
      <form onSubmit={handleSignup} className="w-full max-w-md rounded-md border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="mt-1 text-sm text-base-content/60">Set up your profile in a minute.</p>
        </div>
        {message && (
          <div className={`alert mb-4 text-sm ${messageType === "error" ? "alert-error" : "alert-success"}`}>
            {message}
          </div>
        )}
        <label className="form-control mb-4">
          <span className="label-text mb-2">Full name</span>
          <input className="input input-bordered w-full" type="text" placeholder="Jane Doe"
            value={fullName} onChange={e => setFullName(e.target.value)} required />
        </label>
        <label className="form-control mb-4">
          <span className="label-text mb-2">Email</span>
          <input className="input input-bordered w-full" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="form-control mb-4">
          <span className="label-text mb-2">Profile picture URL</span>
          <input className="input input-bordered w-full" type="url" placeholder="https://example.com/avatar.jpg"
            value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
        </label>
        <label className="form-control mb-4">
          <span className="label-text mb-2">Preferred theme</span>
          <select className="select select-bordered" value={theme} onChange={e => setTheme(e.target.value)}>
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="cupcake">cupcake</option>
            <option value="bumblebee">bumblebee</option>
            <option value="emerald">emerald</option>
            <option value="corporate">corporate</option>
          </select>
        </label>
        <label className="form-control mb-4">
          <span className="label-text mb-2">Password</span>
          <input className="input input-bordered w-full" type="password" placeholder="At least 6 characters"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </label>
        <label className="form-control mb-6">
          <span className="label-text mb-2">Confirm password</span>
          <input className="input input-bordered w-full" type="password" placeholder="Repeat password"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </label>
        <button className="btn btn-primary w-full" disabled={loading || cooldownSeconds > 0}>
          {loading
            ? <span className="loading loading-spinner loading-sm"></span>
            : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : "Sign up"}
        </button>
        <div className="divider text-xs">Already have an account?</div>
        <Link to="/login" className="btn btn-ghost btn-sm w-full">Login</Link>
      </form>
    </div>
  );
}
