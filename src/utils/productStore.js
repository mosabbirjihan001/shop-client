import { apiUrl } from "../config";

const LOCAL_PRODUCTS_KEY = "shopapp_local_products";
const PRODUCT_OVERRIDES_KEY = "shopapp_product_overrides";
const DELETED_PRODUCTS_KEY = "shopapp_deleted_products";

const PRODUCTS_API = apiUrl("/api/products");

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || body.message || `Request failed with status ${response.status}`);
  }
  return body;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProduct(product) {
  return {
    name: product.name?.trim() || "",
    price: Number(product.price || 0),
    stock_quantity: product.stock_quantity == null
      ? null
      : Math.max(0, Math.floor(Number(product.stock_quantity || 0))),
    category: product.category?.trim() || null,
    image_url: product.image_url?.trim() || null,
    description: product.description?.trim() || null,
  };
}

function prepareProductForDisplay(product) {
  return {
    ...product,
    name: product.name?.trim() || "Untitled product",
    price: Number(product.price || 0),
    stock_quantity: product.stock_quantity == null
      ? null
      : Math.max(0, Math.floor(Number(product.stock_quantity || 0))),
    category: product.category?.trim() || "General",
    image_url: product.image_url?.trim() || null,
    description: product.description?.trim() || "",
  };
}

function sortProducts(products) {
  return [...products].sort((a, b) => {
    const aTime = Number(String(a.id).replace(/\D/g, "")) || 0;
    const bTime = Number(String(b.id).replace(/\D/g, "")) || 0;
    return bTime - aTime;
  });
}

export function getLocalProducts() {
  return readJson(LOCAL_PRODUCTS_KEY, []);
}

export function getProductOverrides() {
  return readJson(PRODUCT_OVERRIDES_KEY, {});
}

export function getDeletedProductIds() {
  return readJson(DELETED_PRODUCTS_KEY, []);
}

export function applyLocalProductState(remoteProducts = []) {
  const localProducts = getLocalProducts();
  const overrides = getProductOverrides();
  const deletedIds = new Set(getDeletedProductIds().map(String));

  const mergedRemote = remoteProducts
    .filter((product) => !deletedIds.has(String(product.id)))
    .map((product) => prepareProductForDisplay({ ...product, ...(overrides[String(product.id)] || {}) }));

  const visibleLocal = localProducts
    .filter((product) => !deletedIds.has(String(product.id)))
    .map(prepareProductForDisplay);
  return sortProducts([...visibleLocal, ...mergedRemote]);
}

export async function listProducts(supabase) {
  let apiError = null;

  try {
    const apiProducts = await requestJson(PRODUCTS_API);
    return {
      data: applyLocalProductState(Array.isArray(apiProducts) ? apiProducts : []),
      error: null,
      usedLocalOnly: false,
      source: "api",
    };
  } catch (error) {
    apiError = error;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return {
      data: applyLocalProductState([]),
      error: apiError || error,
      usedLocalOnly: true,
    };
  }

  return {
    data: applyLocalProductState(data || []),
    error: null,
    usedLocalOnly: false,
  };
}

export async function addProduct(supabase, product) {
  const payload = normalizeProduct(product);
  let apiError = null;

  try {
    const response = await requestJson(PRODUCTS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.result) {
      const savedProduct = prepareProductForDisplay({ ...payload, ...response.result });
      const overrides = getProductOverrides();
      overrides[String(savedProduct.id)] = { ...payload, id: savedProduct.id };
      writeJson(PRODUCT_OVERRIDES_KEY, overrides);
      return { product: savedProduct, source: response.source || "api", error: null };
    }
  } catch (error) {
    apiError = error;
  }

  let result = await supabase.from("products").insert([payload]).select();

  if (result.error && /column|schema|cache/i.test(result.error.message)) {
    result = await supabase
      .from("products")
      .insert([{ name: payload.name, price: payload.price }])
      .select();
  }

  if (!result.error && result.data?.[0]) {
    return { product: result.data?.[0], source: "supabase", error: null };
  }

  const insertError = result.error || apiError || new Error("No product row was returned. Supabase may be blocking this operation.");
  const localProduct = {
    ...payload,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString(),
    localOnly: true,
  };
  writeJson(LOCAL_PRODUCTS_KEY, [localProduct, ...getLocalProducts()]);
  return { product: localProduct, source: "local", error: insertError };
}

export async function updateProduct(supabase, id, product) {
  const payload = normalizeProduct(product);

  if (String(id).startsWith("local-")) {
    const products = getLocalProducts().map((item) =>
      String(item.id) === String(id) ? { ...item, ...payload } : item
    );
    writeJson(LOCAL_PRODUCTS_KEY, products);
    return { product: { id, ...payload }, source: "local", error: null };
  }

  let apiError = null;

  try {
    const response = await requestJson(`${PRODUCTS_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.result) {
      const overrides = getProductOverrides();
      overrides[String(id)] = { id, ...payload };
      writeJson(PRODUCT_OVERRIDES_KEY, overrides);
      return { product: prepareProductForDisplay({ ...payload, ...response.result }), source: response.source || "api", error: null };
    }
  } catch (error) {
    apiError = error;
  }

  let result = await supabase.from("products").update(payload).eq("id", id).select();

  if (result.error && /column|schema|cache/i.test(result.error.message)) {
    result = await supabase
      .from("products")
      .update({ name: payload.name, price: payload.price })
      .eq("id", id)
      .select();
  }

  if (!result.error && result.data?.[0]) {
    const overrides = getProductOverrides();
    delete overrides[String(id)];
    writeJson(PRODUCT_OVERRIDES_KEY, overrides);
    return { product: result.data?.[0], source: "supabase", error: null };
  }

  const updateError = result.error || apiError || new Error("No product row was updated. Supabase may be blocking this operation.");
  const overrides = getProductOverrides();
  overrides[String(id)] = { id, ...payload, localOverride: true };
  writeJson(PRODUCT_OVERRIDES_KEY, overrides);
  return { product: overrides[String(id)], source: "local", error: updateError };
}

export async function deleteProductById(supabase, id) {
  if (String(id).startsWith("local-")) {
    writeJson(
      LOCAL_PRODUCTS_KEY,
      getLocalProducts().filter((product) => String(product.id) !== String(id))
    );
    return { source: "local", error: null };
  }

  let apiError = null;

  try {
    await requestJson(`${PRODUCTS_API}/${id}`, { method: "DELETE" });
    const deletedIds = getDeletedProductIds().filter((item) => String(item) !== String(id));
    const overrides = getProductOverrides();
    delete overrides[String(id)];
    writeJson(DELETED_PRODUCTS_KEY, deletedIds);
    writeJson(PRODUCT_OVERRIDES_KEY, overrides);
    return { source: "api", error: null };
  } catch (error) {
    apiError = error;
  }

  const result = await supabase.from("products").delete().eq("id", id).select("id");

  if (!result.error && result.data?.length > 0) {
    const deletedIds = getDeletedProductIds().filter((item) => String(item) !== String(id));
    const overrides = getProductOverrides();
    delete overrides[String(id)];
    writeJson(DELETED_PRODUCTS_KEY, deletedIds);
    writeJson(PRODUCT_OVERRIDES_KEY, overrides);
    return { source: "supabase", error: null };
  }

  const deleteError = result.error || apiError || new Error("No product row was deleted. Supabase may be blocking this operation.");
  const deletedIds = new Set(getDeletedProductIds().map(String));
  deletedIds.add(String(id));
  writeJson(DELETED_PRODUCTS_KEY, [...deletedIds]);
  return { source: "local", error: deleteError };
}

export async function deleteProductsByIds(supabase, ids) {
  const results = [];
  for (const id of ids) {
    results.push(await deleteProductById(supabase, id));
  }
  return results;
}
