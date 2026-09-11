import {
  getMappedPhoneImage,
  PHONE_IMAGE_FALLBACK,
} from "./phoneImageMap";

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
