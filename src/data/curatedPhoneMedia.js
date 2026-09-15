import { getGeneratedCanonicalMedia } from "./generatedCanonicalMedia";

// Curated media collections for exact physical models.
// Keep this file conservative: only add media that is known to belong to the
// exact model. A color name is never paired with an unverified photograph.

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function exactKey(brand, model) {
  const b = normalize(brand);
  let m = normalize(model);
  if (b && m.startsWith(b + " ")) m = m.slice(b.length + 1).trim();
  return b + "|" + m;
}

const CURATED_PHONE_MEDIA = Object.freeze({
  "apple|iphone 12 pro": {
    hero: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg",
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"],
    images: [
      { src: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg", label: "Product image", kind: "hero" }
    ]
  }
});

export function getCuratedPhoneMedia(brand, model) {
  // Hand-curated exact-model media always wins. If it is not available,
  // use the generated SAFE canonical hero catalog. The generated catalog
  // intentionally contains no guessed color/view associations.
  return CURATED_PHONE_MEDIA[exactKey(brand, model)] || getGeneratedCanonicalMedia(brand, model) || null;
}

export default getCuratedPhoneMedia;
