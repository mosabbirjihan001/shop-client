import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, setAdminMode } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setAdminMode(mode === "admin" || result.profile?.role === "admin");
    navigate(mode === "admin" ? "/admin" : "/");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_440px]">
      <section className="hidden lg:block">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Account access</p>
        <h1 className="mt-2 text-5xl font-bold leading-tight">Login for shopping or admin catalog work.</h1>
        <p className="mt-4 max-w-xl text-base-content/65">
          Customers can buy and manage carts. Admins can jump straight into product add, delete, and update tools after signing in.
        </p>
      </section>

      <form onSubmit={handleLogin} className="w-full rounded-md border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-base-content/60">Choose where you want to go after login.</p>
        </div>

        <div className="join mb-5 grid grid-cols-2">
          <button
            className={`btn join-item ${mode === "customer" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("customer")}
            type="button"
          >
            Customer login
          </button>
          <button
            className={`btn join-item ${mode === "admin" ? "btn-warning" : "btn-outline"}`}
            onClick={() => setMode("admin")}
            type="button"
          >
            Admin login
          </button>
        </div>

        {mode === "admin" && (
          <div className="alert alert-warning mb-4 text-sm">
            Admin access requires a successful login. Supabase role admin is supported, and this local app will also start an admin session from this button.
          </div>
        )}

        {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
        <label className="form-control mb-4">
          <span className="label-text mb-2">Email</span>
          <input className="input input-bordered w-full" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="form-control mb-6">
          <span className="label-text mb-2">Password</span>
          <input className="input input-bordered w-full" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm"></span> : mode === "admin" ? "Login as admin" : "Login"}
        </button>
        <div className="divider text-xs">New here?</div>
        <Link to="/signup" className="btn btn-ghost btn-sm w-full">Create an account</Link>
      </form>
    </div>
  );
}
