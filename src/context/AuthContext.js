import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { apiUrl } from "../config";

const AuthContext = createContext(null);
const ADMIN_SESSION_KEY = "shopapp_admin_session";
const PROFILE_KEY = "shopapp_profile";

function readLocalProfile(email) {
  if (!email) return {};
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    return profiles[email] || {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminModeState] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });

  async function fetchProfile(uid, email) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    const localProfile = readLocalProfile(email || data?.email);
    const nextProfile = data
      ? { ...data, ...localProfile, role: data.role || localProfile.role }
      : Object.keys(localProfile).length
        ? { id: uid, email, ...localProfile }
        : null;

    setProfile(nextProfile);
    return nextProfile;
  }

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data?.user) {
      setUser(result.data.user);
      result.profile = await fetchProfile(result.data.user.id, result.data.user.email);
    }
    return result;
  };

  const signup = async (email, password, options) => {
    const metadata = options?.data || {};

    try {
      const response = await fetch(apiUrl("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: metadata.full_name || "",
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        return {
          data: { user: body.user, session: null },
          error: null,
          profile: body.profile || null,
          source: "api",
        };
      }

      if (response.status !== 500 && response.status !== 503) {
        return {
          data: {},
          error: new Error(body.error || `Signup failed with status ${response.status}`),
          source: "api",
        };
      }
    } catch {
      // If the API is not available in local development, fall back to Supabase Auth.
    }

    return supabase.auth.signUp({ email, password, options });
  };

  const setAdminMode = (value) => {
    setAdminModeState(value);
    try {
      if (value) localStorage.setItem(ADMIN_SESSION_KEY, "true");
      else localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage failures; React state still controls this session.
    }
  };

  const logoutAndClear = async () => {
    setAdminMode(false);
    return supabase.auth.signOut();
  };

  const refreshProfile = () => {
    if (!user?.id) return Promise.resolve(null);
    return fetchProfile(user.id, user.email);
  };

  useEffect(() => {
    try {
      const theme = profile?.theme || localStorage.getItem("shopapp_theme") || "light";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("shopapp_theme", theme);
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [profile?.theme]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout: logoutAndClear,
        refreshProfile,
        adminMode,
        isAdmin: profile?.role === "admin" || adminMode,
        setAdminMode,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
