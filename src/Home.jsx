// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// export default function Home() {
//   const [products, setProducts] = useState([]);
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState(""); // Added price state
//   const [loading, setLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // 🔄 GET PRODUCTS
//   const fetchProducts = async () => {
//     setLoading(true);
//     const { data, error } = await supabase
//       .from("products")
//       .select("*")
//       .order("id", { ascending: false });

//     if (error) {
//       console.error("Fetch error:", error.message);
//     } else {
//       setProducts(data || []);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // ➕ ADD PRODUCT
//   const addProduct = async (e) => {
//     e.preventDefault();
//     if (!name.trim() || !price) return;

//     setIsSubmitting(true);
//     const { error } = await supabase
//       .from("products")
//       .insert([{ name, price: parseFloat(price) }]); // Match your DB schema

//     if (error) {
//       alert("Error adding product: " + error.message);
//     } else {
//       setName("");
//       setPrice("");
//       fetchProducts();
//     }
//     setIsSubmitting(false);
//   };

//   // ❌ DELETE PRODUCT
//   const deleteProduct = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this product?")) return;

//     const { error } = await supabase
//       .from("products")
//       .delete()
//       .eq("id", id);

//     if (error) alert(error.message);
//     else fetchProducts();
//   };

//   // ✏️ UPDATE PRODUCT
//   const updateProduct = async (id, currentName, currentPrice) => {
//     const newName = prompt("Update product name:", currentName);
//     if (newName === null) return; // User cancelled

//     const newPrice = prompt("Update price:", currentPrice);
//     if (newPrice === null) return;

//     const { error } = await supabase
//       .from("products")
//       .update({ name: newName, price: parseFloat(newPrice) })
//       .eq("id", id);

//     if (error) alert(error.message);
//     else fetchProducts();
//   };

//   return (
//     <div className="p-8 max-w-5xl mx-auto min-h-screen bg-base-100">
//       <h1 className="text-4xl font-extrabold text-center mb-8 text-primary">
//         Inventory Manager
//       </h1>

//       {/* FORM */}
//       <form onSubmit={addProduct} className="bg-base-200 p-6 rounded-xl shadow-md mb-10">
//         <div className="flex flex-col md:flex-row gap-4 justify-center items-end">
//           <div className="form-control w-full max-w-xs">
//             <label className="label"><span className="label-text font-bold">Product Name</span></label>
//             <input
//               className="input input-bordered w-full"
//               placeholder="e.g. Mechanical Keyboard"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//             />
//           </div>

//           <div className="form-control w-full max-w-xs">
//             <label className="label"><span className="label-text font-bold">Price ($)</span></label>
//             <input
//               type="number"
//               step="0.01"
//               className="input input-bordered w-full"
//               placeholder="0.00"
//               value={price}
//               onChange={(e) => setPrice(e.target.value)}
//               required
//             />
//           </div>

//           <button 
//             className={`btn btn-primary px-8 ${isSubmitting ? 'loading' : ''}`}
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? 'Adding...' : 'Add Product'}
//           </button>
//         </div>
//       </form>

//       {/* STATUS MESSAGES */}
//       {loading && (
//         <div className="flex justify-center my-10">
//           <span className="loading loading-dots loading-lg text-primary"></span>
//         </div>
//       )}

//       {!loading && products.length === 0 && (
//         <div className="alert shadow-lg">
//           <div>
//             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
//             <span>No products in stock. Add one above!</span>
//           </div>
//         </div>
//       )}

//       {/* PRODUCT GRID */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {products.map((p) => (
//           <div key={p.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
//             <div className="card-body p-5">
//               <div className="flex justify-between items-start">
//                 <h2 className="card-title text-xl">{p.name}</h2>
//                 <div className="badge badge-success badge-outline font-mono">
//                   ${parseFloat(p.price || 0).toFixed(2)}
//                 </div>
//               </div>
//               <p className="text-xs text-gray-400 mt-2">Reference ID: {p.id}</p>

//               <div className="card-actions justify-end mt-6 gap-2">
//                 <button
//                   className="btn btn-ghost btn-sm text-warning"
//                   onClick={() => updateProduct(p.id, p.name, p.price)}
//                 >
//                   Edit
//                 </button>
//                 <button
//                   className="btn btn-ghost btn-sm text-error"
//                   onClick={() => deleteProduct(p.id)}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

const API = "http://localhost:5000/api";

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