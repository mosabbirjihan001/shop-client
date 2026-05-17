import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  addProduct,
  deleteProductById,
  deleteProductsByIds,
  listProducts,
  updateProduct,
} from "../utils/productStore";
import { getPaymentStatusLabel } from "../utils/paymentMethods";

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  category: "",
  image_url: "",
  description: "",
};

const DEFAULT_PAGE = {
  hero_label: "Shop smarter",
  hero_title: "Everything in your store, organized like a serious marketplace.",
  hero_subtitle: "Search, compare, filter by department, and keep product management one click away for admins.",
  deal_button: "Shop deals",
  footer_text: "A compact marketplace experience with product browsing, admin catalog control, cart flow, and profile preferences.",
};

const EMPTY_COUPON = {
  code: "",
  type: "percent",
  value: "",
  active: true,
};

const PAGE_KEY = "shopapp_page_settings";
const COUPON_KEY = "shopapp_coupons";
const SALES_KEY = "shopapp_sales";

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [pageSettings, setPageSettings] = useState(() => ({ ...DEFAULT_PAGE, ...readStorage(PAGE_KEY, {}) }));
  const [coupons, setCoupons] = useState(() => readStorage(COUPON_KEY, []));
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [sales, setSales] = useState(() => readStorage(SALES_KEY, []));

  const showMessage = useCallback((text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error, usedLocalOnly } = await listProducts(supabase);

    setProducts(data || []);
    if (error && usedLocalOnly) {
      showMessage(`Supabase read failed, showing local products only: ${error.message}`, "info");
    }
    setLoadingProducts(false);
  }, [showMessage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const unique = products
      .map((product) => product.category)
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
    return ["All", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query
        || product.name?.toLowerCase().includes(query)
        || product.category?.toLowerCase().includes(query)
        || product.description?.toLowerCase().includes(query);
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, search]);

  const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const discountTotal = sales.reduce((sum, sale) => sum + Number(sale.discount || 0), 0);
  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / products.length
    : 0;

  const updateProductForm = (key, value) => {
    setProductForm((current) => ({ ...current, [key]: value }));
  };

  const validateProduct = () => {
    if (!productForm.name.trim()) return "Product name is required.";
    if (!productForm.price || Number(productForm.price) < 0) return "Price must be zero or higher.";
    return "";
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const validationError = validateProduct();
    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    setLoading(true);
    showMessage("");

    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      category: productForm.category.trim() || null,
      image_url: productForm.image_url.trim() || null,
      description: productForm.description.trim() || null,
    };

    const result = editingId
      ? await updateProduct(supabase, editingId, payload)
      : await addProduct(supabase, payload);

    setLoading(false);

    if (result.product) {
      setProducts((currentProducts) => {
        if (editingId) {
          return currentProducts.map((product) =>
            String(product.id) === String(editingId) ? { ...product, ...result.product } : product
          );
        }
        return [result.product, ...currentProducts.filter((product) => String(product.id) !== String(result.product.id))];
      });
    }

    showMessage(
      result.source === "local"
        ? `Product ${editingId ? "updated" : "added"} locally because Supabase blocked the write. It will still show in this app.`
        : editingId ? "Product updated successfully." : "Product added successfully.",
      result.source === "local" ? "info" : "success"
    );
    setEditingId(null);
    setProductForm(EMPTY_PRODUCT);
    await fetchProducts();
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name || "",
      price: product.price ?? "",
      category: product.category || "",
      image_url: product.image_url || "",
      description: product.description || "",
    });
    setActiveTab("products");
    showMessage(`Editing ${product.name}`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicateProduct = (product) => {
    setEditingId(null);
    setProductForm({
      name: `${product.name || ""} Copy`,
      price: product.price ?? "",
      category: product.category || "",
      image_url: product.image_url || "",
      description: product.description || "",
    });
    setActiveTab("products");
    showMessage("Review the copied product, then add it as new.", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const result = await deleteProductById(supabase, product.id);
    showMessage(
      result.source === "local"
        ? "Product hidden locally because Supabase blocked delete. It will no longer show in this app."
        : "Product deleted.",
      result.source === "local" ? "info" : "success"
    );
    setProducts((currentProducts) => currentProducts.filter((item) => String(item.id) !== String(product.id)));
    setSelectedIds((ids) => ids.filter((id) => id !== product.id));
    await fetchProducts();
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;
    const idsToDelete = selectedIds;
    const results = await deleteProductsByIds(supabase, idsToDelete);
    const usedLocal = results.some((result) => result.source === "local");
    showMessage(
      usedLocal
        ? "Selected products removed locally where Supabase blocked delete."
        : "Selected products deleted.",
      usedLocal ? "info" : "success"
    );
    setProducts((currentProducts) =>
      currentProducts.filter((product) => !idsToDelete.map(String).includes(String(product.id)))
    );
    setSelectedIds([]);
    await fetchProducts();
  };

  const toggleProduct = (id) => {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  };

  const toggleVisible = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((ids) => allVisibleSelected
      ? ids.filter((id) => !visibleIds.includes(id))
      : [...new Set([...ids, ...visibleIds])]
    );
  };

  const savePageSettings = (event) => {
    event.preventDefault();
    writeStorage(PAGE_KEY, pageSettings);
    window.dispatchEvent(new Event("shopapp-page-settings"));
    showMessage("Webpage settings saved.", "success");
  };

  const saveCoupon = (event) => {
    event.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    const value = Number(couponForm.value);
    if (!code || !value || value < 0) {
      showMessage("Coupon code and value are required.", "error");
      return;
    }

    const nextCoupons = [
      ...coupons.filter((coupon) => coupon.code !== code),
      { ...couponForm, code, value, active: Boolean(couponForm.active) },
    ];
    setCoupons(nextCoupons);
    writeStorage(COUPON_KEY, nextCoupons);
    setCouponForm(EMPTY_COUPON);
    showMessage("Coupon saved.", "success");
  };

  const deleteCoupon = (code) => {
    const nextCoupons = coupons.filter((coupon) => coupon.code !== code);
    setCoupons(nextCoupons);
    writeStorage(COUPON_KEY, nextCoupons);
    showMessage("Coupon deleted.", "success");
  };

  const clearSales = () => {
    if (!window.confirm("Clear all recorded sales?")) return;
    setSales([]);
    writeStorage(SALES_KEY, []);
    showMessage("Sales history cleared.", "success");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Seller Central</p>
          <h1 className="text-3xl font-bold">Admin control panel</h1>
          <p className="mt-1 text-base-content/60">Manage products, webpage content, coupons, and sales.</p>
        </div>
        <div className="stats stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
          <div className="stat"><div className="stat-title">Products</div><div className="stat-value text-primary">{products.length}</div></div>
          <div className="stat"><div className="stat-title">Total sales</div><div className="stat-value">${salesTotal.toFixed(0)}</div></div>
          <div className="stat"><div className="stat-title">Orders</div><div className="stat-value">{sales.length}</div></div>
        </div>
      </div>

      <div className="tabs tabs-boxed mb-6 w-fit bg-base-100">
        {["dashboard", "products", "webpage", "coupons"].map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)} type="button">
            {tab === "dashboard" ? "Dashboard" : tab === "webpage" ? "Manage webpage" : tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <div className={`alert mb-6 text-sm ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : "alert-info"}`}>
          {message}
        </div>
      )}

      {activeTab === "dashboard" && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold">Sales summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-base-200 p-4"><div className="text-sm text-base-content/60">Total sales</div><div className="text-2xl font-bold">${salesTotal.toFixed(2)}</div></div>
              <div className="rounded-md bg-base-200 p-4"><div className="text-sm text-base-content/60">Orders</div><div className="text-2xl font-bold">{sales.length}</div></div>
              <div className="rounded-md bg-base-200 p-4"><div className="text-sm text-base-content/60">Discounts</div><div className="text-2xl font-bold">${discountTotal.toFixed(2)}</div></div>
            </div>
            <button className="btn btn-error btn-sm mt-4" onClick={clearSales} disabled={sales.length === 0}>Clear sales</button>
          </div>
          <div className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold">Catalog summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-base-200 p-4"><div className="text-sm text-base-content/60">Products</div><div className="text-2xl font-bold">{products.length}</div></div>
              <div className="rounded-md bg-base-200 p-4"><div className="text-sm text-base-content/60">Categories</div><div className="text-2xl font-bold">{Math.max(categories.length - 1, 0)}</div></div>
              <div className="rounded-md bg-base-200 p-4"><div className="text-sm text-base-content/60">Avg price</div><div className="text-2xl font-bold">${averagePrice.toFixed(2)}</div></div>
            </div>
          </div>
          <div className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold">Recent orders</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="table">
                <thead><tr><th>Date</th><th>Items</th><th>Payment</th><th>Status</th><th>Coupon</th><th>Total</th></tr></thead>
                <tbody>
                  {sales.slice().reverse().map((sale) => (
                    <tr key={sale.id}><td>{new Date(sale.date).toLocaleString()}</td><td>{sale.items?.length || 0}</td><td>{sale.paymentMethod || "Cash on delivery"}</td><td>{getPaymentStatusLabel(sale.paymentStatus)}</td><td>{sale.couponCode || "None"}</td><td className="font-bold">${Number(sale.total || 0).toFixed(2)}</td></tr>
                  ))}
                  {sales.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-base-content/50">No sales recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === "webpage" && (
        <section className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="text-xl font-bold">Manage storefront webpage</h2>
          <form onSubmit={savePageSettings} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="form-control"><span className="label-text mb-2">Hero label</span><input className="input input-bordered" value={pageSettings.hero_label} onChange={(event) => setPageSettings({ ...pageSettings, hero_label: event.target.value })} /></label>
            <label className="form-control"><span className="label-text mb-2">Deal button text</span><input className="input input-bordered" value={pageSettings.deal_button} onChange={(event) => setPageSettings({ ...pageSettings, deal_button: event.target.value })} /></label>
            <label className="form-control md:col-span-2"><span className="label-text mb-2">Hero title</span><input className="input input-bordered" value={pageSettings.hero_title} onChange={(event) => setPageSettings({ ...pageSettings, hero_title: event.target.value })} /></label>
            <label className="form-control md:col-span-2"><span className="label-text mb-2">Hero subtitle</span><textarea className="textarea textarea-bordered min-h-24" value={pageSettings.hero_subtitle} onChange={(event) => setPageSettings({ ...pageSettings, hero_subtitle: event.target.value })} /></label>
            <label className="form-control md:col-span-2"><span className="label-text mb-2">Footer text</span><textarea className="textarea textarea-bordered min-h-24" value={pageSettings.footer_text} onChange={(event) => setPageSettings({ ...pageSettings, footer_text: event.target.value })} /></label>
            <div className="md:col-span-2"><button className="btn btn-primary">Save webpage</button></div>
          </form>
        </section>
      )}

      {activeTab === "coupons" && (
        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={saveCoupon} className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold">Add discount coupon</h2>
            <label className="form-control mt-4"><span className="label-text mb-2">Coupon code</span><input className="input input-bordered uppercase" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })} placeholder="SAVE10" /></label>
            <label className="form-control mt-4"><span className="label-text mb-2">Discount type</span><select className="select select-bordered" value={couponForm.type} onChange={(event) => setCouponForm({ ...couponForm, type: event.target.value })}><option value="percent">Percent</option><option value="fixed">Fixed amount</option></select></label>
            <label className="form-control mt-4"><span className="label-text mb-2">Value</span><input className="input input-bordered" type="number" min="0" step="0.01" value={couponForm.value} onChange={(event) => setCouponForm({ ...couponForm, value: event.target.value })} /></label>
            <label className="label mt-4 cursor-pointer justify-start gap-3"><input className="checkbox" type="checkbox" checked={couponForm.active} onChange={(event) => setCouponForm({ ...couponForm, active: event.target.checked })} /><span className="label-text">Active</span></label>
            <button className="btn btn-primary mt-4 w-full">Save coupon</button>
          </form>
          <div className="overflow-hidden rounded-md border border-base-300 bg-base-100 shadow-sm">
            <table className="table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code}><td className="font-bold">{coupon.code}</td><td>{coupon.type}</td><td>{coupon.type === "percent" ? `${coupon.value}%` : `$${Number(coupon.value).toFixed(2)}`}</td><td><span className={`badge ${coupon.active ? "badge-success" : "badge-ghost"}`}>{coupon.active ? "Active" : "Off"}</span></td><td className="text-right"><button className="btn btn-error btn-xs" onClick={() => deleteCoupon(coupon.code)}>Delete</button></td></tr>
                ))}
                {coupons.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-base-content/50">No coupons yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "products" && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold">{editingId ? "Update product" : "Add product"}</h2>
            <form onSubmit={saveProduct} className="mt-4 space-y-4">
              <label className="form-control"><span className="label-text mb-2">Product name</span><input className="input input-bordered w-full" value={productForm.name} onChange={(event) => updateProductForm("name", event.target.value)} required /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="form-control"><span className="label-text mb-2">Price</span><input className="input input-bordered w-full" type="number" step="0.01" min="0" value={productForm.price} onChange={(event) => updateProductForm("price", event.target.value)} required /></label>
                <label className="form-control"><span className="label-text mb-2">Category</span><input className="input input-bordered w-full" value={productForm.category} onChange={(event) => updateProductForm("category", event.target.value)} /></label>
              </div>
              <label className="form-control"><span className="label-text mb-2">Image URL</span><input className="input input-bordered w-full" value={productForm.image_url} onChange={(event) => updateProductForm("image_url", event.target.value)} /></label>
              <label className="form-control"><span className="label-text mb-2">Description</span><textarea className="textarea textarea-bordered min-h-28 w-full" value={productForm.description} onChange={(event) => updateProductForm("description", event.target.value)} /></label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button className="btn btn-primary" disabled={loading}>{loading ? <span className="loading loading-spinner loading-sm"></span> : editingId ? "Update product" : "Add product"}</button>
                <button className="btn btn-ghost" type="button" onClick={() => { setEditingId(null); setProductForm(EMPTY_PRODUCT); }}>Clear</button>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <div className="rounded-md border border-base-300 bg-base-100 p-4 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
                <label className="input input-bordered flex items-center gap-2"><span className="text-sm font-semibold text-base-content/50">Search</span><input className="grow" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <select className="select select-bordered" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <button className="btn btn-error" disabled={selectedIds.length === 0} onClick={deleteSelected} type="button">Delete selected ({selectedIds.length})</button>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-base-300 bg-base-100 shadow-sm">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th><input className="checkbox checkbox-sm" type="checkbox" checked={filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.includes(product.id))} onChange={toggleVisible} /></th><th>Product</th><th>Category</th><th>Price</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>
                    {loadingProducts && <tr><td colSpan="5" className="py-10 text-center"><span className="loading loading-spinner loading-md"></span></td></tr>}
                    {!loadingProducts && filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td><input className="checkbox checkbox-sm" type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleProduct(product.id)} /></td>
                        <td><div className="font-semibold">{product.name}</div>{product.description && <div className="max-w-md truncate text-xs text-base-content/50">{product.description}</div>}</td>
                        <td>{product.category || "Uncategorized"}</td>
                        <td className="font-bold text-error">${Number(product.price || 0).toFixed(2)}</td>
                        <td className="text-right"><div className="join"><button className="btn btn-ghost btn-xs join-item" onClick={() => editProduct(product)}>Edit</button><button className="btn btn-ghost btn-xs join-item" onClick={() => duplicateProduct(product)}>Copy</button><button className="btn btn-error btn-xs join-item" onClick={() => deleteProduct(product)}>Delete</button></div></td>
                      </tr>
                    ))}
                    {!loadingProducts && filteredProducts.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-base-content/50">No products found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
