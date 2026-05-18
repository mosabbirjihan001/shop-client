
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