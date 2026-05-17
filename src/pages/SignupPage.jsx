import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await signup(form.email, form.password, {
      data: { full_name: form.full_name },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Insert into profiles table (role defaults to 'user')
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        role: "user",
      });
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
        <div className="card w-full max-w-sm bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold">Account created!</h2>
            <p className="opacity-60 text-sm mt-1">Check your email to confirm, then log in.</p>
            <Link to="/login" className="btn btn-primary mt-4">Go to login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-sm opacity-60 mt-1">Join us today</p>
          </div>

          {error && (
            <div className="alert alert-error text-sm py-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="form-control">
              <div className="label"><span className="label-text">Full name</span></div>
              <input type="text" className="input input-bordered w-full" placeholder="Jane Doe"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Email</span></div>
              <input type="email" className="input input-bordered w-full" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Password</span></div>
              <input type="password" className="input input-bordered w-full" placeholder="min. 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Confirm password</span></div>
              <input type="password" className="input input-bordered w-full" placeholder="••••••••"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </label>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Create account"}
            </button>
          </form>

          <div className="divider text-xs">Already have one?</div>
          <Link to="/login" className="btn btn-ghost btn-sm w-full">Sign in</Link>
        </div>
      </div>
    </div>
  );
}