// import { useState } from "react";

// function ProductForm({ refresh }) {
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState("");
//   const [loading, setLoading] = useState(false); // New state for UX

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!name || !price) return; // Basic client-side validation

//     setLoading(true);

//     try {
//       await fetch("http://localhost:5000/api/products", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, price: parseFloat(price) }),
//       });

//       // Clear form and sync UI
//       setName("");
//       setPrice("");
//       refresh();
//     } catch (error) {
//       console.error("Failed to add product:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="card bg-base-200 p-6 shadow-inner border border-base-300">
//       <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
//         {/* Product Name Input Group */}
//         <div className="form-control w-full">
//           <label className="label">
//             <span className="label-text font-semibold text-base-content/70">Product Name</span>
//           </label>
//           <input
//             type="text"
//             className="input input-bordered focus:input-primary w-full"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             placeholder="e.g. Wireless Mouse"
//             required
//             disabled={loading}
//           />
//         </div>

//         {/* Price Input Group */}
//         <div className="form-control w-full md:w-48">
//           <label className="label">
//             <span className="label-text font-semibold text-base-content/70">Price</span>
//           </label>
//           <div className="join">
//             <span className="join-item btn btn-disabled bg-base-300 text-base-content">$</span>
//             <input
//               type="number"
//               step="0.01"
//               className="input input-bordered join-item w-full focus:input-primary"
//               value={price}
//               onChange={(e) => setPrice(e.target.value)}
//               placeholder="0.00"
//               required
//               disabled={loading}
//             />
//           </div>
//         </div>

//         {/* Submit Button */}
//         <button 
//           className={`btn btn-primary min-w-[100px] ${loading ? 'loading' : ''}`}
//           disabled={loading}
//         >
//           {loading ? "" : "Add Product"}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default ProductForm;

import { useState } from "react";
import { supabase } from "../supabaseClient";

function ProductForm({ refresh }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("products")
      .insert([{ name, price: parseFloat(price) }]);

    if (error) {
      alert(error.message);
    } else {
      setName("");
      setPrice("");
      refresh(); // This re-loads the product list
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 bg-base-200 p-4 rounded-lg">
      <input 
        className="input input-bordered w-full" 
        placeholder="Name" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        required 
      />
      <input 
        className="input input-bordered w-32" 
        type="number" 
        placeholder="Price" 
        value={price} 
        onChange={e => setPrice(e.target.value)} 
        required 
      />
      <button className={`btn btn-primary ${loading ? 'loading' : ''}`}>Add</button>
    </form>
  );
}

export default ProductForm;