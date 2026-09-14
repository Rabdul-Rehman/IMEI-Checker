"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { lookupPublicImei } from "../../lib/api";
import { getMappedPhoneImage, PHONE_IMAGE_FALLBACK } from "../../lib/phoneImageMap";
import { getMappedPhoneImageByIdentity, getModelVariantOptionsByIdentity } from "../../../data/modelPhoneImageIndex";

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

function SpecValue({ value }) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null"
  ) {
    return <span>—</span>;
  }

  const parsed = parsePossibleJson(value);

  if (typeof parsed === "object" && parsed !== null) {
    return (
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
          color: "inherit",
          fontSize: "inherit",
        }}
      >
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  }

  return <span>{String(parsed)}</span>;
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

  const imageUrl =
    mappedImage ||
    identityMappedImage ||
    getFirstImage(result) ||
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

  const confidence =
    result?.match_confidence !== null &&
    result?.match_confidence !== undefined &&
    result?.match_confidence !== ""
      ? `${Math.round(
          Number(result.match_confidence) * 100
        )}%`
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

  const variantStorage = [...new Set([
    ...(result?.variant_options?.storage_options || []),
    ...(indexedVariants?.storage_options || []),
  ])];

  const variantColors = [...new Set([
    ...(result?.variant_options?.color_options || []),
    ...(indexedVariants?.color_options || []),
  ])];

  const variantEntries = [
    ...(variantStorage.length ? [["Available storage options", variantStorage.join(", ")]] : []),
    ...(variantColors.length ? [["Available colors", variantColors.join(", ")]] : []),
  ];

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
              />
            ) : (
              <i className="fas fa-mobile-screen-button device-icon-fallback" />
            )}

          </div>


          {/* IMEI SUMMARY */}

          <div className="detail-summary detail-summary-left">

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
                <div className="phone-spec-group">

                  <h3 className="phone-spec-group-title">
                    Device Information
                  </h3>

                  <div className="spec-grid-modern">

                    {overviewEntries.map(
                      ([label, value]) => (
                        <div
                          className="spec-modern-card"
                          key={label}
                        >
                          <div className="spec-modern-label">
                            {label}
                          </div>

                          <div className="spec-modern-value">
                            <SpecValue value={value} />
                          </div>
                        </div>
                      )
                    )}

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