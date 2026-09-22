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

function appleCanonicalKey(brand, model) {
  if (normalize(brand) !== "apple") return null;
  const m = normalize(model).replace(/^apple\s+/, "");
  const families = [
    "iphone 17 pro max","iphone 17 pro","iphone 17 plus","iphone 17e","iphone 17",
    "iphone 16 pro max","iphone 16 pro","iphone 16 plus","iphone 16e","iphone 16",
    "iphone 15 pro max","iphone 15 pro","iphone 15 plus","iphone 15",
    "iphone 14 pro max","iphone 14 pro","iphone 14 plus","iphone 14",
    "iphone 13 pro max","iphone 13 pro","iphone 13 mini","iphone 13",
    "iphone 12 pro max","iphone 12 pro","iphone 12 mini","iphone 12",
    "iphone 11 pro max","iphone 11 pro","iphone 11","iphone xs max","iphone xs",
    "iphone xr","iphone se 5g 2022","iphone se 2020"
  ];
  const family = families.find((f) => m === f || m.startsWith(f + " "));
  return family ? "apple|" + family : null;
}

export function getCuratedPhoneMedia(brand, model) {
  const exact = exactKey(brand, model);
  const canonicalApple = appleCanonicalKey(brand, model);
  return CURATED_PHONE_MEDIA[exact] || (canonicalApple ? CURATED_PHONE_MEDIA[canonicalApple] : null) || getGeneratedCanonicalMedia(brand, model) || null;
}

export default getCuratedPhoneMedia;
