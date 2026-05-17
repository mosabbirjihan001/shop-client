export default function ProductCard({ product, action }) {
  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-md border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md">
      <div className="h-48 w-full overflow-hidden bg-base-200">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-semibold text-base-content/35">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="badge badge-ghost badge-sm">{product.category || "General"}</span>
          <span className="text-xs font-semibold text-success">In stock</span>
        </div>
        <h3 className="line-clamp-2 min-h-12 font-bold">{product.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-base-content/65">
          {product.description || "Reliable product details, pricing, and checkout-ready actions."}
        </p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xs">$</span>
          <span className="text-2xl font-bold text-error">{Number(product.price || 0).toFixed(2)}</span>
        </div>
        <div className="mt-4">{action}</div>
      </div>
    </article>
  );
}
