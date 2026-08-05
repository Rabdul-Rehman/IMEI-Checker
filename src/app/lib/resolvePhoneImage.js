/**
 * A small set of manually-curated, guaranteed-accurate local images for
 * specific well-known devices. Checked before the automatic web fallback
 * since these are hand-verified, not a best-guess search result.
 */
const CURATED_IMAGES = {
  "iphone-17-pro": "/images/devices/iphone-17-pro.png",
  "galaxy-s25-ultra": "/images/devices/galaxy-s25-ultra.png",
  "pixel-10-pro": "/images/devices/pixel-10-pro.png",
  "xiaomi-15-ultra": "/images/devices/xiaomi-15-ultra.png",
};

// Set this once a Storage bucket actually exists.
// Configurable via env so it never needs another code change.
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || "phone-images";
const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jitbshriojfiobfybivm.supabase.co";

const CANDIDATE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

/**
 * Builds a Supabase Storage public URL for a given filename ref, and
 * confirms it actually resolves (HEAD request) before trusting it.
 * Tries a few common extensions since the DB only stores the bare name.
 * Returns null immediately/silently if no bucket exists yet or the
 * file isn't uploaded — this is expected right now, not an error state.
 */
async function findStorageImage(filenameRef) {
  if (!filenameRef) return null;

  for (const ext of CANDIDATE_EXTENSIONS) {
    const url = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filenameRef}.${ext}`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      // bucket/file doesn't exist yet — expected for now, just move on
    }
  }
  return null;
}

/**
 * Resolves the best available image for a phone, in priority order:
 * 1. A real file in Supabase Storage matching the `images` column
 *    (currently a no-op until a Storage bucket is set up — fails silently)
 * 2. A manually-curated local image, if this exact device is in CURATED_IMAGES
 * 3. A real photo automatically found via Wikimedia Commons (free, no API key, legally usable)
 * 4. null — DevicePhoto's built-in icon fallback takes over from here
 *
 * This runs server-side (called from an async Server Component), so the
 * fetch happens at render/build time, not in the browser.
 *
 * @param images - the raw `images` column value from Supabase: a JSON array
 *   of filename refs like ["infinix-note-11s-1"], or null/undefined
 */
export async function resolvePhoneImage(brand, modelName, images, slug) {
  // 1. Try Supabase Storage, using the first filename ref if present
  const firstRef = Array.isArray(images) ? images[0] : null;
  const storageImage = await findStorageImage(firstRef);
  if (storageImage) {
    return storageImage;
  }

  // 2. Trust hand-curated local images next
  if (slug && CURATED_IMAGES[slug]) {
    return CURATED_IMAGES[slug];
  }

  // 3. Try Wikimedia Commons as a free, legal auto-fetch fallback
  try {
    const query = encodeURIComponent(`${brand} ${modelName} smartphone`);
    const url =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query&generator=search&gsrsearch=${query}&gsrlimit=1` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`;

    const res = await fetch(url, {
      // Cache each lookup for a day so we don't re-fetch on every page view
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    const first = Object.values(pages)[0];
    const imageUrl = first?.imageinfo?.[0]?.thumburl || first?.imageinfo?.[0]?.url;

    return imageUrl || null;
  } catch (err) {
    // Network hiccup, rate limit, or no match — fail silently and let the
    // icon fallback handle it. This should never break the page.
    // (console.warn, not console.error — Next.js dev mode shows a full-screen
    // overlay for console.error even when it's caught and handled like this.)
    console.warn("resolvePhoneImage: Wikimedia lookup skipped:", err.message);
    return null;
  }
}