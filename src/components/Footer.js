import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const DEFAULT_TEXT = "A compact marketplace experience with product browsing, admin catalog control, cart flow, and profile preferences.";

function loadFooterText() {
  try {
    const settings = JSON.parse(localStorage.getItem("shopapp_page_settings")) || {};
    return settings.footer_text || DEFAULT_TEXT;
  } catch {
    return DEFAULT_TEXT;
  }
}

export default function Footer() {
  const [footerText, setFooterText] = useState(loadFooterText);

  useEffect(() => {
    const refresh = () => setFooterText(loadFooterText());
    window.addEventListener("shopapp-page-settings", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("shopapp-page-settings", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <footer className="mt-10 border-t border-base-300 bg-neutral text-neutral-content">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-xl font-bold">ShopApp</div>
          <p className="mt-2 max-w-md text-sm text-neutral-content/70">
            {footerText}
          </p>
        </div>
        <div>
          <div className="font-semibold">Shop</div>
          <div className="mt-2 grid gap-1 text-sm">
            <Link to="/">Products</Link>
            <Link to="/cart">Cart</Link>
            <a href="/#products">Deals</a>
          </div>
        </div>
        <div>
          <div className="font-semibold">Account</div>
          <div className="mt-2 grid gap-1 text-sm">
            <Link to="/profile">Profile</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Create account</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-content/10 px-4 py-3 text-center text-xs text-neutral-content/60">
        Built for catalog management and everyday shopping.
      </div>
    </footer>
  );
}
