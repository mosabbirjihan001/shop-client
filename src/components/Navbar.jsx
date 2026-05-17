import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-100 shadow-sm px-4 sticky top-0 z-50">
      {/* Brand */}
      <div className="navbar-start">
        <Link to="/" className="text-xl font-bold text-primary">
          🛍 ShopApp
        </Link>
      </div>

      {/* Desktop links */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li><Link to="/">Shop</Link></li>
          {profile?.role === "admin" && (
            <li><Link to="/admin" className="text-warning">Admin</Link></li>
          )}
        </ul>
      </div>

      {/* Right side */}
      <div className="navbar-end gap-2">
        <Link to="/cart" className="btn btn-ghost btn-circle">
          <div className="indicator">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </Link>

        {user ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-8">
                <span className="text-sm">{user.email[0].toUpperCase()}</span>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title text-xs opacity-60 px-2">{user.email}</li>
              {profile?.role === "admin" && <li><Link to="/admin">Admin Panel</Link></li>}
              <li><button onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </div>
  );
}