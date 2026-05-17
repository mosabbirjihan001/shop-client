import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await login(form.email, form.password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm opacity-60 mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="alert alert-error text-sm py-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="form-control">
              <div className="label"><span className="label-text">Email</span></div>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Password</span></div>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Sign in"}
            </button>
          </form>

          <div className="divider text-xs">No account?</div>
          <Link to="/signup" className="btn btn-ghost btn-sm w-full">Create account</Link>
        </div>
      </div>
    </div>
  );
}