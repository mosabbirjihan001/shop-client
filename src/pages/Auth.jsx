import { useState } from "react";
import { supabase } from "../supabaseClient";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Signup successful!");
  };

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Login successful!");
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-5">Login / Signup</h1>

      <input
        className="input input-bordered w-full mb-3"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input input-bordered w-full mb-3"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-primary w-full mb-2" onClick={login}>
        Login
      </button>

      <button className="btn btn-secondary w-full" onClick={signup}>
        Signup
      </button>
    </div>
  );
}

export default Auth;
