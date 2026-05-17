import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { listProducts } from "../utils/productStore";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      const { data, error: productError } = await listProducts(supabase);
      const foundProduct = (data || []).find((item) => String(item.id) === String(id));

      if (!mounted) return;
      if (productError && !foundProduct) {
        setError(productError.message);
        setLoading(false);
        return;
      }

      if (!foundProduct) {
        setError("Product not found.");
        setLoading(false);
        return;
      }

      setProduct(foundProduct);
      if (foundProduct?.category) {
        setRelated(
          (data || [])
            .filter((item) => item.category === foundProduct.category && String(item.id) !== String(foundProduct.id))
            .slice(0, 4)
        );
      }
      setLoading(false);
    }

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  const add = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    addToCart(product, quantity);
  };

  const buyNow = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    addToCart(product, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="skeleton h-96 w-full"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-base-content/60">{error || "This product is not available."}</p>
        <Link to="/" className="btn btn-primary mt-6">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 text-sm breadcrumbs">
        <ul>
          <li><Link to="/">Shop</Link></li>
          <li>{product.category || "Product"}</li>
        </ul>
      </div>

      <section className="grid gap-6 rounded-md border border-base-300 bg-base-100 p-5 shadow-sm lg:grid-cols-[420px_1fr_280px]">
        <div className="overflow-hidden rounded-md bg-base-200">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full min-h-96 w-full object-cover" />
          ) : (
            <div className="grid min-h-96 place-items-center text-base-content/40">No image</div>
          )}
        </div>

        <div>
          <span className="badge badge-ghost">{product.category || "General"}</span>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="badge badge-warning">4.6</span>
            <span className="text-base-content/60">Customer rating</span>
          </div>
          <div className="divider"></div>
          <p className="text-4xl font-bold text-error">${Number(product.price || 0).toFixed(2)}</p>
          <p className="mt-3 text-base-content/70">
            {product.description || "A quality product with fast delivery and easy checkout."}
          </p>
          <ul className="mt-5 grid gap-2 text-sm">
            <li>Free delivery on eligible orders</li>
            <li>Secure checkout with saved cart</li>
            <li>Managed by ShopApp catalog admins</li>
          </ul>
        </div>

        <aside className="rounded-md border border-base-300 bg-base-200 p-4">
          <p className="text-2xl font-bold text-error">${Number(product.price || 0).toFixed(2)}</p>
          <p className="mt-1 text-sm text-success">In stock</p>
          <label className="form-control mt-4">
            <span className="label-text mb-2">Quantity</span>
            <input
              className="input input-bordered"
              min="1"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            />
          </label>
          {isAdmin ? (
            <Link to="/admin" className="btn btn-primary mt-4 w-full">Update in admin</Link>
          ) : (
            <div className="mt-4 grid gap-2">
              <button className="btn btn-warning" onClick={add}>Add to cart</button>
              <button className="btn btn-primary" onClick={buyNow}>Buy now</button>
            </div>
          )}
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Related products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="rounded-md border border-base-300 bg-base-100 p-4 shadow-sm hover:shadow-md">
                <div className="font-semibold line-clamp-2">{item.name}</div>
                <div className="mt-2 font-bold text-error">${Number(item.price || 0).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
