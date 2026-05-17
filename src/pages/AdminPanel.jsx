import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const EMPTY = { name: "", price: "", category: "", image_url: "", description: "" };

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name: form.name, price: parseFloat(form.price), category: form.category, image_url: form.image_url, description: form.description };

    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) showToast(error.message, "error");
      else { showToast("Product updated!"); setEditingId(null); setForm(EMPTY); }
    } else {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) showToast(error.message, "error");
      else { showToast("Product added!"); setForm(EMPTY); }
    }

    await fetchProducts();
    setLoading(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, price: p.price, category: p.category || "", image_url: p.image_url || "", description: p.description || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    showToast("Deleted.", "warning");
    fetchProducts();
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert alert-${toast.type}`}>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="opacity-60 mb-8">Manage your product catalog</p>

      {/* Stats */}
      <div className="stats shadow bg-base-100 w-full mb-8">
        <div className="stat">
          <div className="stat-title">Total products</div>
          <div className="stat-value text-primary">{products.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Avg price</div>
          <div className="stat-value">
            ${products.length ? (products.reduce((s, p) => s + Number(p.price), 0) / products.length).toFixed(2) : "0.00"}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow mb-8">
        <div className="card-body">
          <h2 className="card-title">{editingId ? "Edit product" : "Add new product"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control">
              <div className="label"><span className="label-text">Product name *</span></div>
              <input className="input input-bordered" placeholder="e.g. Running Shoes" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Price (USD) *</span></div>
              <input type="number" step="0.01" min="0" className="input input-bordered" placeholder="29.99"
                value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Category</span></div>
              <input className="input input-bordered" placeholder="e.g. Footwear" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })} />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">Image URL</span></div>
              <input className="input input-bordered" placeholder="https://..." value={form.image_url}
                onChange={e => setForm({ ...form, image_url: e.target.value })} />
            </label>

            <label className="form-control md:col-span-2">
              <div className="label"><span className="label-text">Description</span></div>
              <textarea className="textarea textarea-bordered" rows={3} placeholder="Short product description…"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : editingId ? "Update product" : "Add product"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Product Table */}
      <div className="card bg-base-100 shadow overflow-x-auto">
        <div className="card-body p-0">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-10 h-10 bg-base-200">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-lg">📦</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs opacity-50 line-clamp-1">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.category && <span className="badge badge-ghost badge-sm">{p.category}</span>}
                  </td>
                  <td className="font-bold text-primary">${Number(p.price).toFixed(2)}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-xs mr-1" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn btn-error btn-xs" onClick={() => deleteProduct(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={4} className="text-center opacity-40 py-8">No products yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}