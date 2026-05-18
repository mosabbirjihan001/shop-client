const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_INLINE_IMAGE_SIZE = 1.5 * 1024 * 1024;

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image preview could not be created."));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

async function createCompactDataUrl(file) {
  const original = await readFileAsDataUrl(file);
  const image = await loadImage(original);
  const maxSide = 1100;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function uploadProductImage(supabase, file) {
  if (!file) return { url: "", source: "none" };
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) return { url: data.publicUrl, source: "storage" };
  } catch {
    // Fall back below so admins can still add product images if Storage is not configured.
  }

  const compactDataUrl = await createCompactDataUrl(file);

  if (compactDataUrl.length > MAX_INLINE_IMAGE_SIZE) {
    throw new Error("Image storage is not configured and this image is too large for local fallback. Use a smaller image or create a public Supabase bucket named product-images.");
  }

  return { url: compactDataUrl, source: "inline" };
}
