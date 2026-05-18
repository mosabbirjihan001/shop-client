
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

const API = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : "http://localhost:5000/api";

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(data => { setProducts(data); setFiltered(data); })
      .catch(() => setError("Failed to load products."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p => p.name.toLowerCase().includes(q)));
  }, [search, products]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="hero bg-primary text-primary-content rounded-2xl mb-10 py-12 px-8">
        <div className="hero-content text-center flex-col">
          <h1 className="text-4xl font-bold mb-2">Welcome to ShopApp</h1>
          <p className="opacity-80 text-lg mb-6">Discover amazing products at great prices</p>

          {/* Auth CTAs — only shown when logged out */}
          {!user && (
            <div className="flex gap-3 mb-6">
              <Link to="/signup" className="btn btn-secondary">Create account</Link>
              <Link to="/login" className="btn btn-outline btn-secondary text-primary-content border-primary-content hover:bg-primary-content hover:text-primary">
                Sign in
              </Link>
            </div>
          )}

          <label className="input input-bordered input-lg flex items-center gap-2 bg-base-100 text-base-content w-full max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70">
              <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              className="grow"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats shadow bg-base-100 w-full mb-8">
        <div className="stat">
          <div className="stat-title">Total products</div>
          <div className="stat-value text-primary">{products.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Showing</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
      </div>

      {/* Grid */}
      {loading && (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}
      {error && (
        <div className="alert alert-error"><span>{error}</span></div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <p className="text-2xl mb-2">🔍</p>
          <p>No products found</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </main>
  );
}