import {
  getMappedPhoneImage,
  PHONE_IMAGE_FALLBACK,
} from "./phoneImageMap";


function canonicalDeviceIdentity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb|mb)\b/gi, " ")
    .replace(/\ba\d{4}\b/gi, " ")
    .replace(/\b(?:global|dual|single|sim|td|lte|td-lte|uw|emea|latam|apac|usa|us|cn|jp|ca|eu|uk|india)\b/gi, " ")
    .replace(/\b(?:3g|4g|5g)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const VERIFIED_MODEL_IMAGE_OVERRIDES = {
  // The generated catalog currently reuses group-1229 for both iPhone 12 Pro
  // and iPhone 12 Pro Max. That shared asset is not safe for exact-model UI.
  // Use Apple's official iPhone 12 Pro product artwork for the 12 Pro family.
  "apple|iphone 12 pro": "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg",
};

function getVerifiedModelImageOverride(phone) {
  const brand = canonicalDeviceIdentity(phone?.brand_name ?? phone?.reported_brand ?? phone?.brand ?? "");
  const model = canonicalDeviceIdentity(phone?.reported_model_name ?? phone?.model_name ?? phone?.model ?? "");
  return VERIFIED_MODEL_IMAGE_OVERRIDES[brand + "|" + model] || null;
}

function normalizeImageReference(value) {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return `/phone-images/${trimmed}`;
}

export function resolvePhoneImage(phone) {
  if (!phone) {
    return PHONE_IMAGE_FALLBACK;
  }

  const verifiedOverride = getVerifiedModelImageOverride(phone);
  if (verifiedOverride) return verifiedOverride;

  /*
   * First priority:
   * our verified phone_id -> physical-device image mapping.
   *
   * This does NOT require changing Supabase.
   */
  const phoneId =
    phone.phone_id ??
    phone.id ??
    null;

  if (phoneId !== null && phoneId !== undefined) {
    const mapped = getMappedPhoneImage(phoneId);

    if (mapped !== PHONE_IMAGE_FALLBACK) {
      return mapped;
    }
  }

  /*
   * Second priority:
   * preserve existing database image references.
   */
  const images = phone.images;

  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === "string") {
        const resolved = normalizeImageReference(item);
        if (resolved) return resolved;
      }

      if (item && typeof item === "object") {
        const candidate =
          item.url ??
          item.src ??
          item.path ??
          item.filename ??
          item.image_url ??
          null;

        const resolved = normalizeImageReference(candidate);

        if (resolved) return resolved;
      }
    }
  }

  if (images && typeof images === "object") {
    const candidate =
      images.url ??
      images.src ??
      images.path ??
      images.filename ??
      images.image_url ??
      null;

    const resolved = normalizeImageReference(candidate);

    if (resolved) return resolved;
  }

  if (typeof images === "string") {
    const resolved = normalizeImageReference(images);
    if (resolved) return resolved;
  }

  /*
   * Every phone therefore always has an image source.
   */
  return getMappedPhoneImage(phoneId);
}

export function phoneImageFallback() {
  return PHONE_IMAGE_FALLBACK;
}

export default resolvePhoneImage;
