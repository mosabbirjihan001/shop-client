import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // SIGN UP
  const signup = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) return alert(error.message);

    alert("Signup successful! Now login.");
  };

  // LOGIN
  const login = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return alert(error.message);

    navigate("/"); // go to dashboard
  };

  return (
    <div className="flex items-center justify-center h-screen bg-base-200">

      <div className="card w-96 bg-base-100 shadow-xl p-6">

        <h1 className="text-2xl font-bold text-center mb-4">
          Login / Signup
        </h1>

        <input
          className="input input-bordered w-full mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="input input-bordered w-full mb-3"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="btn btn-primary w-full mb-2"
          onClick={login}
          disabled={loading}
        >
          Login
        </button>

        <button
          className="btn btn-secondary w-full"
          onClick={signup}
          disabled={loading}
        >
          Signup
        </button>

      </div>
    </div>
  );
}

export default Auth;
