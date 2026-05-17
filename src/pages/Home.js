import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { listProducts } from "../utils/productStore";

const SORTS = {
  featured: "Featured",
  priceLow: "Price: Low to high",
  priceHigh: "Price: High to low",
  name: "Name",
};

const DEFAULT_PAGE = {
  hero_label: "Shop smarter",
  hero_title: "Everything in your store, organized like a serious marketplace.",
  hero_subtitle: "Search, compare, filter by department, and keep product management one click away for admins.",
  deal_button: "Shop deals",
};

const PAGE_KEY = "shopapp_page_settings";

function loadPageSettings() {
  try {
    return { ...DEFAULT_PAGE, ...(JSON.parse(localStorage.getItem(PAGE_KEY)) || {}) };
  } catch {
    return DEFAULT_PAGE;
  }
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageSettings, setPageSettings] = useState(loadPageSettings);
  const { user, isAdmin } = useAuth();
  const { count, addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError("");
      const { data, error: productError, usedLocalOnly } = await listProducts(supabase);

      if (!mounted) return;
      if (productError && usedLocalOnly) setError(productError.message);
      setProducts(data || []);
      setLoading(false);
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refresh = () => setPageSettings(loadPageSettings());
    window.addEventListener("shopapp-page-settings", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("shopapp-page-settings", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const categories = useMemo(() => {
    const unique = products
      .map((product) => product.category)
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
    return ["All", ...unique];
  }, [products]);

  const highestPrice = useMemo(() => {
    return Math.max(0, ...products.map((product) => Number(product.price || 0)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const limit = maxPrice ? Number(maxPrice) : null;

    const result = products.filter((product) => {
      const matchesSearch = !query
        || product.name?.toLowerCase().includes(query)
        || product.description?.toLowerCase().includes(query)
        || product.category?.toLowerCase().includes(query);
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = limit === null || Number(product.price || 0) <= limit;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    return [...result].sort((a, b) => {
      if (sort === "priceLow") return Number(a.price || 0) - Number(b.price || 0);
      if (sort === "priceHigh") return Number(b.price || 0) - Number(a.price || 0);
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [category, maxPrice, products, search, sort]);

  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / products.length
    : 0;

  const featured = filteredProducts[0] || products[0];

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("featured");
    setMaxPrice("");
  };

  const buyNow = (product) => {
    if (!user) {
      navigate("/login");
      return;
    }
    addToCart(product);
    navigate("/cart");
  };

  return (
    <div className="bg-base-200">
      <section className="border-b border-base-300 bg-neutral text-neutral-content">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-warning">{pageSettings.hero_label}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">
              {pageSettings.hero_title}
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-content/75">
              {pageSettings.hero_subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#products" className="btn btn-warning btn-sm">{pageSettings.deal_button}</a>
              {isAdmin && <Link to="/admin" className="btn btn-outline btn-sm border-neutral-content text-neutral-content">Manage catalog</Link>}
            </div>
          </div>

          <div className="rounded-md bg-base-100 p-4 text-base-content shadow-lg">
            <div className="text-sm font-semibold text-base-content/60">Today&apos;s featured item</div>
            {featured ? (
              <div className="mt-3 flex gap-4">
                <ProductImage product={featured} compact />
                <div className="min-w-0">
                  <h2 className="line-clamp-2 font-bold">{featured.name}</h2>
                  <p className="mt-1 text-sm text-base-content/60">{featured.category || "General"}</p>
                  <p className="mt-2 text-2xl font-bold text-error">${Number(featured.price || 0).toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-base-content/60">Add your first product from the admin panel.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 grid gap-3 rounded-md border border-base-300 bg-base-100 p-4 shadow-sm lg:grid-cols-[1fr_180px_180px]">
          <label className="input input-bordered flex items-center gap-2 bg-base-100">
            <span className="text-sm font-semibold text-base-content/50">Search</span>
            <input
              className="grow"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, categories, descriptions"
              type="search"
            />
          </label>
          <select className="select select-bordered" value={sort} onChange={(event) => setSort(event.target.value)}>
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={resetFilters} type="button">Clear filters</button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-md border border-base-300 bg-base-100 p-4 shadow-sm">
              <h2 className="font-bold">Departments</h2>
              <div className="mt-3 space-y-1">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={`btn btn-sm w-full justify-start ${category === item ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-base-300 bg-base-100 p-4 shadow-sm">
              <h2 className="font-bold">Price</h2>
              <label className="form-control mt-3">
                <span className="label-text mb-2">Max price</span>
                <input
                  className="input input-bordered input-sm"
                  min="0"
                  placeholder={highestPrice ? `$${Math.ceil(highestPrice)}` : "$0"}
                  type="number"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </label>
              <div className="mt-4 rounded-md bg-base-200 p-3 text-sm">
                <div className="font-semibold">{products.length} items</div>
                <div className="text-base-content/60">Average ${averagePrice.toFixed(2)}</div>
              </div>
            </section>

            <section className="rounded-md border border-base-300 bg-base-100 p-4 shadow-sm">
              <h2 className="font-bold">Cart</h2>
              <p className="mt-2 text-sm text-base-content/60">{count} item{count === 1 ? "" : "s"} currently saved.</p>
              <Link to="/cart" className="btn btn-warning btn-sm mt-3 w-full">View cart</Link>
            </section>
          </aside>

          <section id="products">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Results</h2>
                <p className="text-sm text-base-content/60">Showing {filteredProducts.length} of {products.length} products</p>
              </div>
              {user && !isAdmin && (
                <div className="badge badge-lg badge-warning">Ready for checkout flow</div>
              )}
            </div>

            {loading && <ProductSkeletons />}
            {error && <div className="alert alert-error">{error}</div>}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="rounded-md border border-dashed border-base-300 bg-base-100 p-10 text-center">
                <h3 className="text-lg font-bold">No products match your filters</h3>
                <p className="mt-1 text-sm text-base-content/60">Clear filters or add more products from the admin panel.</p>
                <Link to="/admin" className="btn btn-primary mt-5">Add product in admin</Link>
              </div>
            )}

            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="flex min-h-full flex-col overflow-hidden rounded-md border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md">
                    <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                      <ProductImage product={product} />
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="badge badge-ghost badge-sm">{product.category || "General"}</span>
                        <span className="text-xs font-semibold text-success">In stock</span>
                      </div>
                      <Link to={`/product/${product.id}`} className="line-clamp-2 min-h-12 font-bold hover:text-primary">
                        {product.name}
                      </Link>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-base-content/65">
                        {product.description || "Reliable product details, pricing, and checkout-ready actions."}
                      </p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-xs">$</span>
                        <span className="text-2xl font-bold text-error">{Number(product.price || 0).toFixed(2)}</span>
                      </div>
                      <p className="mt-1 text-xs text-base-content/50">Free delivery on eligible orders</p>
                      <div className="mt-4 grid gap-2">
                        {user && !isAdmin ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button className="btn btn-warning btn-sm" onClick={() => addToCart(product)}>
                              Add cart
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => buyNow(product)}>
                              Buy now
                            </button>
                          </div>
                        ) : isAdmin ? (
                          <Link to="/admin" className="btn btn-primary btn-sm">Update in admin</Link>
                        ) : (
                          <Link to="/login" className="btn btn-warning btn-sm">Login to buy</Link>
                        )}
                        <Link to={`/product/${product.id}`} className="btn btn-ghost btn-sm">View details</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProductImage({ product, compact = false }) {
  const sizeClass = compact ? "h-24 w-24" : "h-48 w-full";

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden bg-base-200`}>
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-center text-sm font-semibold text-base-content/35">
          No image
        </div>
      )}
    </div>
  );
}

function ProductSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="rounded-md bg-base-100 p-4 shadow-sm">
          <div className="skeleton mb-4 h-48 w-full"></div>
          <div className="skeleton mb-3 h-5 w-3/4"></div>
          <div className="skeleton mb-3 h-4 w-full"></div>
          <div className="skeleton h-8 w-1/2"></div>
        </div>
      ))}
    </div>
  );
}
