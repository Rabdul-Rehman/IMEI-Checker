"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { lookupPublicImei } from "../../lib/api";
import { getMappedPhoneImage, PHONE_IMAGE_FALLBACK } from "../../lib/phoneImageMap";
import { getMappedPhoneImageByIdentity, getModelVariantOptionsByIdentity } from "../../../data/modelPhoneImageIndex";
import { getCuratedPhoneMedia } from "../../../data/curatedPhoneMedia";
import { isAmbiguousCanonicalPhoneModel } from "../../../data/ambiguousCanonicalPhoneModels";

function parsePossibleJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null"
  ) {
    return "—";
  }

  const parsed = parsePossibleJson(value);

  if (typeof parsed === "object" && parsed !== null) {
    return JSON.stringify(parsed);
  }

  return String(parsed);
}

function humanizeKey(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function flattenSpecValue(value, prefix = "") {
  const parsed = parsePossibleJson(value);

  if (
    parsed === null ||
    parsed === undefined ||
    parsed === "" ||
    parsed === "null"
  ) {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => {
      if (item && typeof item === "object") {
        return flattenSpecValue(item, prefix);
      }
      return [[prefix, String(item)]];
    });
  }

  if (typeof parsed === "object") {
    return Object.entries(parsed).flatMap(([key, child]) =>
      flattenSpecValue(child, prefix ? `${prefix} · ${humanizeKey(key)}` : humanizeKey(key))
    );
  }

  return [[prefix, String(parsed)]];
}

function SpecValue({ value }) {
  const rows = flattenSpecValue(value);

  if (!rows.length) return <span>—</span>;

  const hasLabels = rows.some(([label]) => label);

  if (!hasLabels) {
    return (
      <div className="spec-readable-list">
        {rows.map(([, text], index) => (
          <span className="spec-readable-chip" key={`${text}-${index}`}>
            {text}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="spec-readable-object">
      {rows.map(([label, text], index) => (
        <div className="spec-readable-row" key={`${label}-${text}-${index}`}>
          {label ? <span className="spec-readable-key">{label}</span> : null}
          <span className="spec-readable-text">{text}</span>
        </div>
      ))}
    </div>
  );
}

function normalizeImageUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  let url = value.trim();

  // Handle markdown-style image links if they accidentally exist
  // in the database response.
  const markdownMatch = url.match(/\((https?:\/\/[^)]+)\)/);

  if (markdownMatch) {
    url = markdownMatch[1];
  }

  // Remove accidental markdown brackets.
  url = url.replace(/^\[|\]$/g, "");

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  ) {
    return url;
  }

  return "";
}

function getFirstImage(result) {
  if (!result) {
    return "";
  }

  if (Array.isArray(result.images)) {
    for (const image of result.images) {
      const normalized = normalizeImageUrl(image);

      if (normalized) {
        return normalized;
      }
    }
  }

  return normalizeImageUrl(result.image);
}

function getCategory(specs, names) {
  for (const name of names) {
    if (specs?.[name]) {
      return specs[name];
    }
  }

  return null;
}

function getCategoryEntries(specs, names) {
  const category = getCategory(specs, names);

  if (!category) {
    return [];
  }

  if (typeof category === "object" && !Array.isArray(category)) {
    return Object.entries(category);
  }

  return [["Value", category]];
}

function pickSpec(specs, paths) {
  for (const [section, key] of paths) {
    const value = specs?.[section]?.[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function normalizeVariantList(values) {
  return [...new Set((values || []).map((v) => String(v).trim()).filter(Boolean))];
}

function VariantChips({ values, type = "text" }) {
  if (!values?.length) return <span className="variant-empty">Not available</span>;

  return (
    <div className={type === "color" ? "variant-color-list" : "variant-chip-list"}>
      {values.map((value) =>
        type === "color" ? (
          <span className="variant-color-item" key={value}>
            <span
              className="variant-color-dot"
              style={{ background: getColorSwatch(value) }}
            />
            <span>{value}</span>
          </span>
        ) : (
          <span className="variant-chip" key={value}>{value}</span>
        )
      )}
    </div>
  );
}

const KNOWN_MODEL_VARIANTS = {
  "apple|iphone 12 pro": {
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"],
  },
  "apple|iphone 12 pro max": {
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"],
  },
  "apple|iphone 12 mini": {
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Black", "White", "(PRODUCT)RED", "Green", "Blue", "Purple"],
  },
  "apple|iphone 12": {
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Black", "White", "(PRODUCT)RED", "Green", "Blue", "Purple"],
  },
  "google|pixel 7": {
    storage: ["128GB", "256GB"],
    colors: ["Obsidian", "Snow", "Lemongrass"],
  },
  "xiaomi|mi 11 lite": {
    storage: ["64GB", "128GB"],
    colors: ["Boba Black", "Bubblegum Blue", "Peach Pink"],
  },
};

function canonicalIdentity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKnownModelVariants(brand, model) {
  const brandKey = canonicalIdentity(brand);
  let modelKey = canonicalIdentity(model);

  // TAC feeds often return model names prefixed with the manufacturer
  // (for example "Apple iPhone 12 Pro"). Our variant keys intentionally
  // store only the marketing model, so remove that duplicate prefix.
  if (brandKey && modelKey.startsWith(brandKey + " ")) {
    modelKey = modelKey.slice(brandKey.length + 1).trim();
  }

  const key = `${brandKey}|${modelKey}`;
  return KNOWN_MODEL_VARIANTS[key] || { storage: [], colors: [] };
}

function getColorSwatch(name) {
  const key = String(name || "").toLowerCase();
  const map = {
    graphite: "#4c4d4f",
    black: "#181818",
    silver: "#dfe2e5",
    white: "#f5f5f3",
    gold: "#e6c58b",
    blue: "#2c6ea7",
    "pacific blue": "#2f698f",
    red: "#b73131",
    green: "#527760",
    purple: "#7566a8",
    pink: "#d79aaa",
    "pacific blue": "#3e6f91",
    "product red": "#c51f2f",
    "(product)red": "#c51f2f",
    "boba black": "#2a2a2d",
    "bubblegum blue": "#a8d7ef",
    "peach pink": "#efc0b4",
    obsidian: "#28282a",
    snow: "#f3f1ed",
    lemongrass: "#d7df9f",
  };
  return map[key] || "#60758c";
}

function SpecGroup({ title, values }) {
  if (!values || values.length === 0) {
    return null;
  }

  return (
    <div className="phone-spec-group">
      <h3 className="phone-spec-group-title">{title}</h3>

      <div className="spec-grid-modern">
        {values.map(([key, value]) => (
          <div className="spec-modern-card" key={key}>
            <div className="spec-modern-label">
              {String(key).replace(/_/g, " ")}
            </div>

            <div className="spec-modern-value">
              <SpecValue value={value} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams();

  const imei = String(params?.imei || "");
  const valid = /^\d{15}$/.test(imei);

  const [loading, setLoading] = useState(valid);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!valid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await lookupPublicImei(imei);

        if (cancelled) {
          return;
        }

        setResult(response?.data || null);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(
            err?.message ||
              "Failed to load IMEI information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [imei, valid]);

  const specs = useMemo(() => {
    if (!result?.specs_json) {
      return {};
    }

    if (
      typeof result.specs_json === "object" &&
      result.specs_json !== null
    ) {
      return result.specs_json;
    }

    const parsed = parsePossibleJson(result.specs_json);

    if (
      typeof parsed === "object" &&
      parsed !== null
    ) {
      return parsed;
    }

    return {};
  }, [result]);

  const tac = result?.tac || imei.slice(0, 8);
  const snr = imei.slice(8, 14);
  const checkDigit = imei.slice(14);

  const mappedCandidate =
    result?.phone_id &&
    result?.image_match_verified !== false
      ? getMappedPhoneImage(result.phone_id)
      : "";

  // IMPORTANT: getMappedPhoneImage() returns PHONE_IMAGE_FALLBACK when a
  // phone_id has no real image. Treat that fallback as "no mapped image" so
  // the exact brand+model identity index can provide the real device image.
  const mappedImage =
    mappedCandidate && mappedCandidate !== PHONE_IMAGE_FALLBACK
      ? mappedCandidate
      : "";

  // Real/random IMEIs often have correct TAC-reported brand/model details but
  // no internal phone_id. Fall back to a build-generated exact identity index
  // from our verified local catalog so those results still get the same local
  // image used by the Phone Database.
  const identityMappedImage = getMappedPhoneImageByIdentity(
    result?.reported_brand || result?.brand_name || "",
    result?.reported_model_name || result?.model_name || "",
    result?.reported_model_number || result?.model_number || ""
  );

  // Prefer the verified brand/model/model-number identity image over a
  // historical phone_id mapping. Old TAC rows can point at the wrong catalog
  // phone_id; identity matching is stricter and prevents sibling/wrong-device
  // photos (for example a different Vivo Y-series handset).
  const normalizedResultModel = String(result?.reported_model_name || result?.model_name || "").toLowerCase();
  const normalizedResultBrand = String(result?.reported_brand || result?.brand_name || "").toLowerCase();
  // Never let a family substring cross from Pro to Pro Max (or vice versa).
  // The local generated index currently shares one historical asset between
  // these two families, so only the exact iPhone 12 Pro family gets this
  // verified Apple product image override.
  const canonicalResultModel = normalizedResultModel
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb|mb)\b/g, " ")
    .replace(/\ba\d{4}\b/g, " ")
    .replace(/\b(?:global|dual|single|sim|td|lte|td-lte|uw|emea|latam|apac|usa|us|cn|jp|ca|eu|uk|india|3g|4g|5g)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Do not override an exact catalog identity with a generic remote family
  // image. Remote editorial assets can be composites/crops and previously
  // caused an incorrect four-lens iPhone image on the IMEI result page.
  const exactModelKey = (() => {
    const brandKey = canonicalIdentity(result?.reported_brand || result?.brand_name || "");
    let modelKey = canonicalIdentity(result?.reported_model_name || result?.model_name || "");
    if (brandKey && modelKey.startsWith(brandKey + " ")) {
      modelKey = modelKey.slice(brandKey.length + 1).trim();
    }
    return `${brandKey}|${modelKey}`;
  })();

  // Exact verified override for the iPhone 12 Pro result. The generated
  // identity catalog currently points some 12 Pro rows at a bad four-lens
  // composite. Never allow that asset to win on this exact model.
  const VERIFIED_RESULT_IMAGE_OVERRIDES = {
    "apple|iphone 12 pro":
      "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg",
  };

  const mediaBrand = result?.reported_brand || result?.brand_name || "";
  const mediaModel = result?.reported_model_name || result?.model_name || "";
  const mediaIsAmbiguous = isAmbiguousCanonicalPhoneModel(mediaBrand, mediaModel);
  const curatedMedia = mediaIsAmbiguous ? null : getCuratedPhoneMedia(mediaBrand, mediaModel);

  const imageUrl =
    curatedMedia?.hero ||
    VERIFIED_RESULT_IMAGE_OVERRIDES[exactModelKey] ||
    identityMappedImage ||
    mappedImage ||
    (result?.image_match_verified !== false ? getFirstImage(result) : "") ||
    "";

  const brand =
    result?.brand_name ||
    result?.reported_brand ||
    "Unknown";

  const model =
    result?.reported_model_name ||
    result?.model_name ||
    "Unknown device";

  const modelNumber =
    result?.reported_model_number ||
    result?.model_number ||
    null;

  const confidenceNumber = Number(result?.match_confidence);
  const confidence =
    result?.match_confidence !== null &&
    result?.match_confidence !== undefined &&
    result?.match_confidence !== "" &&
    Number.isFinite(confidenceNumber)
      ? `${Math.round(confidenceNumber <= 1 ? confidenceNumber * 100 : confidenceNumber)}%`
      : "—";

  const matchStatus =
    result?.match_status || "Matched";

  const overviewEntries = [
    ["IMEI", imei],
    ["TAC", tac],
    ["Brand", brand],
    ["Model", model],
    ["Model number", modelNumber],
    ["Region", result?.reported_region],
    ["Year", result?.reported_year],
    ["Device type", result?.device_type],
    ["Match status", matchStatus],
    ["Confidence", confidence],
  ];

  const rawMemoryEntries = getCategoryEntries(
    specs,
    ["Memory"]
  );

  // IMEI/TAC identifies the model family, not an individual handset's exact
  // storage/color. Show every known option for this model instead of claiming
  // one catalog variant is the user's exact configuration.
  const indexedVariants = getModelVariantOptionsByIdentity(
    result?.reported_brand || result?.brand_name || "",
    result?.reported_model_name || result?.model_name || ""
  );

  const knownVariants = getKnownModelVariants(
    result?.reported_brand || result?.brand_name || "",
    result?.reported_model_name || result?.model_name || ""
  );

  const variantStorage = [...new Set([
    ...(result?.variant_options?.storage_options || []),
    ...(indexedVariants?.storage_options || []),
    ...(knownVariants?.storage || []),
  ])];

  const specColorCandidates = (() => {
    const body = getCategory(specs, ["Body / Design", "Body"]) || {};
    const misc = getCategory(specs, ["Miscellaneous"]) || {};
    const values = [
      body?.colors_available,
      body?.colors,
      body?.colour,
      body?.color,
      misc?.colors_available,
      misc?.colors,
      misc?.colour,
      misc?.color,
      misc?.finish,
    ];

    const out = [];
    for (const value of values) {
      if (!value) continue;
      const list = Array.isArray(value)
        ? value
        : String(value).split(/[,/|;]+/);
      for (const item of list) {
        const clean = String(item || "").trim();
        if (clean) out.push(clean);
      }
    }
    return out;
  })();

  const variantColors = [...new Set([
    ...(result?.variant_options?.color_options || []),
    ...(indexedVariants?.color_options || []),
    ...specColorCandidates,
    ...(knownVariants?.colors || []),
  ])];

  const variantEntries = [
    ...(variantStorage.length ? [["Available storage options", variantStorage.join(", ")]] : []),
    ...(variantColors.length ? [["Available colors", variantColors.join(", ")]] : []),
  ];

  const displaySize = pickSpec(specs, [
    ["Display", "display_size_inches"],
    ["Display", "screen_size_inches"],
    ["Display", "diagonal"],
    ["Display", "diagonal_inches"],
    ["Display", "size_inches"],
    ["Display", "size"],
    ["Display", "display_size"],
  ]);
  const displayType = pickSpec(specs, [
    ["Display", "display_type"],
    ["Display", "type"],
  ]);
  const chipset = pickSpec(specs, [
    ["Platform", "chipset"],
    ["Platform", "processor"],
    ["Platform", "cpu"],
    ["Platform", "CPU"],
  ]);
  const rearCamera = pickSpec(specs, [
    ["Camera (Main)", "rear_camera_specs"],
    ["Camera (Main)", "main_camera"],
    ["Camera", "main"],
    ["Camera (Main)", "rear_camera_features"],
  ]);

  const cameraSummary = (() => {
    const value = rearCamera;
    if (!value) return "—";
    const text = typeof value === "string" ? value : JSON.stringify(value);
    const mp = [...text.matchAll(/(?:megapixels?|mp)\D{0,8}(\d+(?:\.\d+)?)/gi)];
    if (mp.length) return `${mp[0][1]} MP`;
    const direct = text.match(/\b(\d+(?:\.\d+)?)\s*MP\b/i);
    if (direct) return `${direct[1]} MP`;
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === "object") {
        const mpValue = first.megapixels ?? first.megapixel ?? first.mp;
        if (mpValue) return `${mpValue} MP`;
      }
      return String(first || "—");
    }
    return typeof value === "object" ? "Camera system" : String(value);
  })();
  const batteryCapacity = pickSpec(specs, [
    ["Battery", "battery_capacity_mah"],
    ["Battery", "capacity"],
  ]);
  const ramOptions = pickSpec(specs, [
    ["Memory", "ram_options"],
    ["Memory", "ram"],
  ]);

  const cleanVariantStorage = normalizeVariantList(variantStorage);
  const cleanVariantColors = normalizeVariantList(variantColors);

  // Build a media gallery only from images that belong to this exact result.
  // The API may return strings or objects (url/src/path/image_url + optional
  // color/view labels). We never borrow images from sibling models.
  const resultMedia = (() => {
    const raw = [];
    for (const item of curatedMedia?.images || []) raw.push(item);
    const add = (item, label = "") => {
      if (!item) return;
      if (typeof item === "string") {
        const src = normalizeImageUrl(item);
        if (src) raw.push({ src, label });
        return;
      }
      if (typeof item === "object") {
        const src = normalizeImageUrl(
          item.url || item.src || item.path || item.image_url || item.image
        );
        if (!src) return;
        raw.push({
          src,
          label:
            item.label ||
            item.color ||
            item.colour ||
            item.finish ||
            item.view ||
            item.type ||
            label ||
            "",
        });
      }
    };

    add(imageUrl, "Main");
    if (Array.isArray(result?.images)) result.images.forEach((item) => add(item));
    else add(result?.images);
    add(result?.image);

    // The API now returns deduplicated images from every catalog row that
    // belongs to the SAME physical model family (regional/storage variants
    // are allowed; Pro/Max/Mini/Ultra sibling models are rejected server-side).
    // This lets the result page show front/back/color product photography
    // whenever those exact-model assets exist in our database.
    const familyImages = result?.variant_options?.family_images || [];
    if (Array.isArray(familyImages)) {
      familyImages.forEach((item) => add(item));
    }

    const colorImages =
      result?.variant_options?.color_images ||
      result?.variant_options?.colour_images ||
      result?.color_images ||
      result?.colour_images ||
      null;

    if (Array.isArray(colorImages)) {
      colorImages.forEach((item) => add(item));
    } else if (colorImages && typeof colorImages === "object") {
      Object.entries(colorImages).forEach(([label, item]) => add(item, label));
    }

    const viewImages = result?.view_images || result?.device_views || null;
    if (Array.isArray(viewImages)) viewImages.forEach((item) => add(item));
    else if (viewImages && typeof viewImages === "object") {
      Object.entries(viewImages).forEach(([label, item]) => add(item, label));
    }

    const seen = new Set();
    return raw.filter((item) => {
      const key = item.src;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 12);
  })();

  const normalizedVariantStorage = new Set(
    variantStorage.map((v) => String(v).replace(/\s+/g, "").toUpperCase())
  );

  // Hide a single catalog record's storage (for example 512GB) from Memory.
  // Keep RAM and other memory-related fields. Storage is shown only in the
  // Model Variants section above.
  const memoryEntries = rawMemoryEntries.filter(([key, value]) => {
    const label = String(key || "");
    if (/storage|capacity|internal|rom|flash|non.?volatile|built.?in/i.test(label)) {
      return false;
    }

    const text = Array.isArray(value)
      ? value.join(" ")
      : typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value || "");

    const capacities = text.match(/\b\d+(?:\.\d+)?\s*(?:GB|TB)\b/gi) || [];
    if (
      capacities.some((v) =>
        normalizedVariantStorage.has(String(v).replace(/\s+/g, "").toUpperCase())
      )
    ) {
      return false;
    }

    return true;
  });

  const batteryEntries = getCategoryEntries(
    specs,
    ["Battery"]
  );

  const displayEntries = getCategoryEntries(
    specs,
    ["Display"]
  );

  const platformEntries = getCategoryEntries(
    specs,
    ["Platform"]
  );

  const bodyEntries = getCategoryEntries(
    specs,
    ["Body / Design", "Body"]
  );

  const cameraMainEntries = getCategoryEntries(
    specs,
    ["Camera (Main)", "Camera"]
  );

  const cameraFrontEntries = getCategoryEntries(
    specs,
    ["Camera (Front)"]
  );

  const connectivityEntries = getCategoryEntries(
    specs,
    ["Connectivity / Communications", "Connectivity"]
  );

  const sensorsEntries = getCategoryEntries(
    specs,
    ["Sensors & Features", "Sensors"]
  );

  const soundEntries = getCategoryEntries(
    specs,
    ["Sound", "Audio"]
  );

  const miscellaneousEntries = getCategoryEntries(
    specs,
    ["Miscellaneous"]
  );

  if (!valid) {
    return (
      <div className="not-found-page">
        <div className="not-found-card">
          <div className="not-found-status">
            <span className="not-found-dot" />
            INVALID IMEI
          </div>

          <div className="not-found-code">
            IMEI
            <span className="not-found-code-dash">—</span>
            ERROR
          </div>

          <h1 className="not-found-title">
            Invalid IMEI number
          </h1>

          <p className="not-found-text">
            Please enter a valid 15-digit IMEI number
            to check the device information.
          </p>

          <div className="not-found-actions">
            <Link
              href="/"
              className="primary-action not-found-btn-primary"
            >
              <i className="fas fa-arrow-left" />
              Back to IMEI Check
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-ring">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="loading-text">
          Looking up IMEI information...
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="not-found-page">
        <div className="not-found-card">
          <div className="not-found-status">
            <span className="not-found-dot" />
            LOOKUP FAILED
          </div>

          <div className="not-found-code">
            404
          </div>

          <h1 className="not-found-title">
            Device information not found
          </h1>

          <p className="not-found-text">
            {error ||
              "No device information was found for this IMEI."}
          </p>

          <div className="not-found-actions">
            <Link
              href="/"
              className="primary-action"
            >
              <i className="fas fa-arrow-left" />
              Check another IMEI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-modern">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="detail-breadcrumb">
        <Link href="/">
          IMEI Check
        </Link>

        <span>/</span>

        <span>Result</span>
      </div>


      {/* =====================================================
          MAIN TWO COLUMN LAYOUT
          LEFT  = IMAGE
          RIGHT = DEVICE INFORMATION
      ===================================================== */}

      <div className="phone-detail-main">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="phone-detail-left">

          <div className="detail-image">

            <span className="detail-image-badge">
              IMEI RESULT
            </span>

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={model}
                loading="eager"
                decoding="async"
              />
            ) : (
              <i className="fas fa-mobile-screen-button device-icon-fallback" />
            )}

            <div className="imei-valid-strip">
              <span className="imei-valid-pill">
                <i className="fas fa-circle-check" />
                Valid IMEI
              </span>
              <span className="imei-tac-inline">TAC: {tac}</span>
            </div>

          </div>

          <div className="imei-device-media">
            {resultMedia.length > 1 ? (
              <>
                <span className="imei-media-heading">Device Views</span>
                <div className="imei-media-grid">
                  {resultMedia.map((item, index) => (
                    <div className="imei-media-card" key={`${item.src}-${index}`}>
                      <img src={item.src} alt={item.label ? `${model} - ${item.label}` : model} />
                      <span>{item.label || `View ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {cleanVariantColors.length ? (
              <>
                <span className="imei-media-heading">Available Colors</span>
                <div className="imei-media-colors">
                  {cleanVariantColors.map((color) => (
                    <div className="imei-media-color" key={color}>
                      <span
                        className="variant-color-dot"
                        style={{ background: getColorSwatch(color) }}
                      />
                      <span>{color}</span>
                    </div>
                  ))}
                </div>
                {resultMedia.length <= 1 ? (
                  <small className="imei-media-note">
                    Exact-model product photos will appear above whenever they exist in the catalog; color names are never paired with an unverified photo.
                  </small>
                ) : null}
              </>
            ) : null}
          </div>


          {/* IMEI SUMMARY */}

          <div className="detail-summary detail-summary-left imei-technical-details">

            <div>
              <span>IMEI</span>
              <strong>{imei}</strong>
            </div>

            <div>
              <span>TAC</span>
              <strong>{tac}</strong>
            </div>

            <div>
              <span>Check Digit</span>
              <strong>{checkDigit}</strong>
            </div>

            <div>
              <span>Brand</span>
              <strong>{displayValue(brand)}</strong>
            </div>

            <div>
              <span>Year</span>
              <strong>
                {displayValue(result.reported_year)}
              </strong>
            </div>

            <div>
              <span>Confidence</span>
              <strong>{confidence}</strong>
            </div>

          </div>

        </div>


        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="phone-detail-right">

          <div className="detail-copy">

            <span className="section-eyebrow">
              LIVE IMEI LOOKUP
            </span>

            <h1>
              {displayValue(model)}
            </h1>

            <p className="text-secondary">
              {displayValue(brand)}
              {modelNumber
                ? ` · ${displayValue(modelNumber)}`
                : ""}
            </p>


            <div className="detail-meta">

              <span className="detail-tag">
                {displayValue(matchStatus)}
              </span>

              <span className="detail-tag">
                Confidence {confidence}
              </span>

              {result.reported_year ? (
                <span className="detail-tag">
                  {result.reported_year}
                </span>
              ) : null}

              {result.reported_region ? (
                <span className="detail-tag">
                  {displayValue(
                    result.reported_region
                  )}
                </span>
              ) : null}

            </div>


            <div className="detail-actions">

              <Link
                href="/"
                className="primary-action"
              >
                <i className="fas fa-search" />
                Check another IMEI
              </Link>

              <Link
                href="/phones"
                className="outline-action"
              >
                Phone Database
                <i className="fas fa-arrow-right" />
              </Link>

              <Link
                href="/imei-generator"
                className="outline-action"
              >
                IMEI Generator
                <i className="fas fa-arrow-right" />
              </Link>

            </div>

          </div>


          {/* =================================================
              SPECIFICATION TABS
          ================================================= */}

          <div className="phone-spec-tabs">

            <div className="phone-spec-tab-buttons">

              <button
                type="button"
                className={
                  activeTab === "overview"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("overview")
                }
              >
                OVERVIEW
              </button>

              <button
                type="button"
                className={
                  activeTab === "hardware"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("hardware")
                }
              >
                HARDWARE
              </button>

              <button
                type="button"
                className={
                  activeTab === "camera"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("camera")
                }
              >
                CAMERA
              </button>

              <button
                type="button"
                className={
                  activeTab === "connectivity"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("connectivity")
                }
              >
                CONNECTIVITY
              </button>

              <button
                type="button"
                className={
                  activeTab === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("all")
                }
              >
                ALL SPECS
              </button>

            </div>


            <div className="phone-spec-tab-content">

              {/* ============================================
                  OVERVIEW
              ============================================ */}

              {activeTab === "overview" && (
                <div className="imei-overview-dashboard">
                  <div className="imei-summary-grid">
                    <div className="imei-summary-card">
                      <span className="imei-summary-icon"><i className="fas fa-mobile-screen" /></span>
                      <div>
                        <span>Display</span>
                        <strong>{displaySize ? `${displaySize}"` : "—"}</strong>
                        <small>{displayType || "Display specification"}</small>
                      </div>
                    </div>

                    <div className="imei-summary-card">
                      <span className="imei-summary-icon"><i className="fas fa-camera" /></span>
                      <div>
                        <span>Camera</span>
                        <strong>{cameraSummary}</strong>
                        <small>Main camera system</small>
                      </div>
                    </div>

                    <div className="imei-summary-card">
                      <span className="imei-summary-icon"><i className="fas fa-microchip" /></span>
                      <div>
                        <span>Processor</span>
                        <strong>{chipset || "—"}</strong>
                        <small>{Array.isArray(ramOptions) ? ramOptions.join(", ") : (ramOptions || "RAM data")}</small>
                      </div>
                    </div>

                    <div className="imei-summary-card">
                      <span className="imei-summary-icon"><i className="fas fa-battery-three-quarters" /></span>
                      <div>
                        <span>Battery</span>
                        <strong>{batteryCapacity ? `${batteryCapacity} mAh` : "—"}</strong>
                        <small>Model battery specification</small>
                      </div>
                    </div>
                  </div>

                  <div className="imei-variant-panel">
                    <div className="imei-variant-block">
                      <span className="imei-variant-label">
                        <i className="fas fa-hard-drive" /> Storage Options
                      </span>
                      <VariantChips values={cleanVariantStorage} />
                    </div>

                    <div className="imei-variant-block">
                      <span className="imei-variant-label">
                        <i className="fas fa-palette" /> Available Colors
                      </span>
                      <VariantChips values={cleanVariantColors} type="color" />
                    </div>
                  </div>

                  <div className="imei-model-variants-box">
                    <div>
                      <span className="section-eyebrow">MODEL VARIANTS</span>
                      <h3>Available configurations for this model</h3>
                      <p>IMEI identifies the device family. These are the known storage and color variants in the catalog.</p>
                    </div>
                    <div className="imei-model-variants-grid">
                      <div>
                        <span>Storage Variants</span>
                        <VariantChips values={cleanVariantStorage} />
                      </div>
                      <div>
                        <span>Color Variants</span>
                        <VariantChips values={cleanVariantColors} type="color" />
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* ============================================
                  HARDWARE
              ============================================ */}

              {activeTab === "hardware" && (
                <>
                  <SpecGroup
                    title="Display"
                    values={displayEntries}
                  />

                  <SpecGroup
                    title="Platform"
                    values={platformEntries}
                  />

                  <SpecGroup
                    title="Model Variants"
                    values={variantEntries}
                  />

                  <SpecGroup
                    title="Memory"
                    values={memoryEntries}
                  />

                  <SpecGroup
                    title="Battery"
                    values={batteryEntries}
                  />

                  <SpecGroup
                    title="Body & Design"
                    values={bodyEntries}
                  />

                  <SpecGroup
                    title="Sensors & Features"
                    values={sensorsEntries}
                  />

                  <SpecGroup
                    title="Sound"
                    values={soundEntries}
                  />
                </>
              )}


              {/* ============================================
                  CAMERA
              ============================================ */}

              {activeTab === "camera" && (
                <>
                  <SpecGroup
                    title="Main Camera"
                    values={cameraMainEntries}
                  />

                  <SpecGroup
                    title="Front Camera"
                    values={cameraFrontEntries}
                  />
                </>
              )}


              {/* ============================================
                  CONNECTIVITY
              ============================================ */}

              {activeTab === "connectivity" && (
                <>
                  <SpecGroup
                    title="Connectivity & Communications"
                    values={connectivityEntries}
                  />
                </>
              )}


              {/* ============================================
                  ALL SPECS
              ============================================ */}

              {activeTab === "all" && (
                <>
                  <SpecGroup
                    title="Display"
                    values={displayEntries}
                  />

                  <SpecGroup
                    title="Platform"
                    values={platformEntries}
                  />

                  <SpecGroup
                    title="Memory"
                    values={memoryEntries}
                  />

                  <SpecGroup
                    title="Battery"
                    values={batteryEntries}
                  />

                  <SpecGroup
                    title="Body & Design"
                    values={bodyEntries}
                  />

                  <SpecGroup
                    title="Main Camera"
                    values={cameraMainEntries}
                  />

                  <SpecGroup
                    title="Front Camera"
                    values={cameraFrontEntries}
                  />

                  <SpecGroup
                    title="Connectivity"
                    values={connectivityEntries}
                  />

                  <SpecGroup
                    title="Sensors & Features"
                    values={sensorsEntries}
                  />

                  <SpecGroup
                    title="Sound"
                    values={soundEntries}
                  />

                  <SpecGroup
                    title="Miscellaneous"
                    values={miscellaneousEntries}
                  />
                </>
              )}

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          BOTTOM CTA
      ===================================================== */}

      <div className="detail-next-step">

        <div>

          <span className="section-eyebrow">
            NEXT STEP
          </span>

          <h2>
            Need to check another device?
          </h2>

          <p>
            Enter another 15-digit IMEI and get
            the latest device information from
            the database.
          </p>

        </div>

        <Link
          href="/"
          className="primary-action"
        >
          Check another IMEI
          <i className="fas fa-arrow-right" />
        </Link>

      </div>

    </div>
  );
}