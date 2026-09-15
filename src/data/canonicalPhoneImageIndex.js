// Safe canonical model image resolver.
//
// IMPORTANT: this layer is conservative. It only returns explicitly approved
// canonical-model mappings. Never add fuzzy/sibling matching here.

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PREFIXES = new Set([
  "apple","iphone","google","pixel","xiaomi","mi","redmi","poco","samsung","galaxy",
  "motorola","moto","oneplus","oppo","realme","vivo","iqoo","huawei","honor","nokia",
  "sony","tecno","infinix","itel","lg","htc","zte","asus"
]);
const NOISE = new Set(["5g","4g","3g","lte","td","uw","dual","sim","global","na","jp","ca","cn","eu","uk","apac","emea","latam","ram"]);

function canonicalModel(value) {
  const parts = normalize(value).split(" ").filter(Boolean);
  while (parts.length && PREFIXES.has(parts[0])) parts.shift();
  return parts
    .filter((t) => !NOISE.has(t) && !/^a\d{4}$/.test(t) && !/^\d+(?:gb|tb|mb)$/.test(t))
    .join(" ");
}

// Seeded with models that have been explicitly reviewed. The offline builder
// can expand this file safely after an audit.
const SAFE_CANONICAL_PHONE_IMAGES = Object.freeze({
  "apple|12 pro": "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg",
});

export function getSafeCanonicalPhoneImage(brand, model) {
  const key = normalize(brand) + "|" + canonicalModel(model);
  return SAFE_CANONICAL_PHONE_IMAGES[key] || "";
}

export default getSafeCanonicalPhoneImage;
