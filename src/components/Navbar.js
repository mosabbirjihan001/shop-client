import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#131921] text-white shadow">
      <div className="navbar mx-auto max-w-7xl px-4">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#ff9900] text-[#131921]">
              S
            </span>
            ShopApp
          </Link>
        </div>

        <nav className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal gap-1 px-1">
            <li><Link className="hover:bg-white/10" to="/">Shop</Link></li>
            <li><a className="hover:bg-white/10" href="/#products">Deals</a></li>
            <li><Link className="hover:bg-white/10" to="/cart">Cart</Link></li>
            {isAdmin && <li><Link className="hover:bg-white/10" to="/admin">Admin</Link></li>}
          </ul>
        </nav>

        <div className="navbar-end gap-2">
          <Link to="/cart" className="btn btn-ghost btn-sm text-white hover:bg-white/10">
            Cart
            {count > 0 && <span className="badge badge-warning badge-sm">{count}</span>}
          </Link>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm text-white hover:bg-white/10">Login</Link>
              <Link to="/signup" className="btn btn-warning btn-sm">Sign up</Link>
            </>
          ) : (
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost gap-2 px-2 text-white hover:bg-white/10" type="button">
                <span className="h-8 w-8 overflow-hidden rounded-full bg-[#ff9900] text-sm font-bold text-[#131921]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center">{initial}</span>
                  )}
                </span>
                <span className="hidden max-w-40 truncate text-sm md:inline">{displayName}</span>
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-50 mt-3 w-56 rounded-md border border-base-300 bg-base-100 p-2 shadow-xl">
                <li className="menu-title px-3 text-xs">
                  <span>{profile?.role || "user"}</span>
                </li>
                <li><Link to="/profile">Profile and theme</Link></li>
                <li><Link to="/cart">Cart ({count})</Link></li>
                {isAdmin && <li><Link to="/admin">Admin panel</Link></li>}
                <li><button onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
