import { getGeneratedCanonicalMedia } from "./generatedCanonicalMedia";

// Curated exact-model baseline media. Rich color/view galleries live in phoneRichMedia.
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
    hero: "https://ardes.bg/uploads/original/apple-iphone-12-pro-295645.jpg",
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"],
    images: []
  },
  "apple|iphone 12 pro max": {
    hero: "https://www.apple.com/newsroom/images/product/availability/Apple_iphone12mini-iphone12max-homepodmini-availability_iphone12promax-us_110520_inline.jpg.large.jpg",
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"],
    storage: ["128GB", "256GB", "512GB"],
    images: []
  }
});

export function getCuratedPhoneMedia(brand, model) {
  return CURATED_PHONE_MEDIA[exactKey(brand, model)] || getGeneratedCanonicalMedia(brand, model) || null;
}

export default getCuratedPhoneMedia;
