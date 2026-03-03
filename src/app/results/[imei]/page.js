"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function ResultsPage() {
  const params = useParams();
  const imei = params.imei || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!imei) return;

    fetch(`/api/imei?imei=${encodeURIComponent(imei)}`)
      .then((res) => res.json())
      .then((resData) => {
        console.log("Full API Response:", resData);

        if (resData.success) {
          setData({
            local: resData.local || null,
            external: resData.external || null,
          });
        } else {
          setError(resData.error || "No data found.");
        }
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setError("An error occurred while processing your request.");
      });
  }, [imei]);

  const tac = imei.substring(0, 8);
  const snr = imei.substring(8, 14);
  const cd = imei.substring(14);

  if (error) {
    return <div className="text-danger text-center mt-5">{error}</div>;
  }

  if (!data) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  const { local, external } = data;
  const specs = local?.specs_json || {};

  return (
    <div className="container-fluid full-container">
      {/* Section one */}
      <div className="container-fluid section-1">
        <img src="/images/imeinet.svg" alt="" className="img-header" />

        <div className="section-content text-center">
          <h1>{external?.name || "Unknown Model"}</h1>
          <h2 className="results mt-4">
            {external?.brand} / {external?.model || "N/A"}
          </h2>

          <div className="container my-4"></div>

          <div className="d-flex justify-content-center mt-5 h4">
            <div className="row text-center imei">
              <div className="col">
                <h2>{tac}</h2>
                <h4 className="h4">TAC</h4>
              </div>
              <div className="col">
                <h2>{snr}</h2>
                <h4 className="h4">SNR</h4>
              </div>
              <div className="col">
                <h2>{cd}</h2>
                <h4 className="h4">CD</h4>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="results mb-4">CHECK NOW</h2>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <button className="btn btn-primary">Samsung Warranty</button>
              <button className="btn btn-primary">Carrier Info</button>
              <button className="btn btn-primary">More Services</button>
            </div>
          </div>
        </div>
      </div>

      {/* BASIC INFO */}
      <div className="result-container my-5">
        <div className="header-section d-flex justify-content-between align-items-center">
          <div className="basic-info-title">BASIC INFO</div>
          <div className="spec-link">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Full device specification →
            </a>
          </div>
        </div>

        <div className="content-section">
          <div className="device-layout">
            <div className="device-image">
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=400&fit=crop&crop=center"
                alt={local?.model_name || "Device Image"}
              />
            </div>

            <div className="specs-grid">
              {/* Always visible specs */}
              <div className="spec-row">
                <div className="spec-item">
                  <span className="spec-label">Device type</span>
                  <span className="spec-value">Smartphone</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">LTE / 5G</span>
                  <span className="spec-value feature-badge">
                    <span className="check-icon">✓</span>
                    <span>/</span>
                  </span>
                </div>
              </div>

              <div className="spec-row">
                <div className="spec-item">
                  <span className="spec-label">Released</span>
                  <span className="spec-value">
                    {local?.specs_json?.General?.release_date || "N/A"}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Battery</span>
                  <span className="spec-value">
                    {specs.Battery?.battery_type || ""},{" "}
                    {specs.Battery?.battery_capacity_mah || "N/A"} mAh
                  </span>
                </div>
              </div>

              <div className="spec-row">
                <div className="spec-item">
                  <span className="spec-label">Operating System</span>
                  <span className="spec-value">
  {typeof specs.Platform?.os === "object"
    ? specs.Platform?.os?.current || specs.Platform?.os?.original || "N/A"
    : specs.Platform?.os || "N/A"}
</span>

                </div>
                <div className="spec-item">
                  <span className="spec-label">Built-in NFC</span>
                  <span className="spec-value feature-badge">
                    {specs["Connectivity / Communications"]?.nfc ? (
                      <span className="check-icon">✓</span>
                    ) : (
                      "✗"
                    )}
                  </span>
                </div>
              </div>

              <div className="spec-row">
              <div className="spec-item">
  <span className="spec-label">Chipset</span>
  <span className="spec-value">
    {typeof specs.Platform?.chipset === "object"
      ? specs.Platform?.chipset?.["5G_variant"] ||
        specs.Platform?.chipset?.["4G_variant"] ||
        "N/A"
      : specs.Platform?.chipset || "N/A"}
  </span>
</div>

<div className="spec-item">
  <span className="spec-label">Display</span>
  <span className="spec-value">
    {typeof specs.Display?.display_type === "object"
      ? specs.Display?.display_type?.["4G_variant"] ||
        specs.Display?.display_type?.["5G_variant"] ||
        "N/A"
      : specs.Display?.display_type || "N/A"}{" "}
    {typeof specs.Display?.display_size_inches === "object"
      ? specs.Display?.display_size_inches?.["4G_variant"] ||
        specs.Display?.display_size_inches?.["5G_variant"] ||
        "N/A"
      : specs.Display?.display_size_inches || "N/A"}{" "}
    inches
  </span>
</div>

              </div>

              <div className="spec-row">
                <div className="spec-item">
                  <span className="spec-label">SIM card size</span>
                  <span className="spec-value">
                    {specs["Body / Design"]?.sim_type || "N/A"}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Built-in GPS</span>
                  <span className="spec-value feature-badge">
                    {specs["Connectivity / Communications"]?.gps_support ? (
                      <span className="check-icon">✓</span>
                    ) : (
                      "✗"
                    )}
                  </span>
                </div>
              </div>

              {/* Expandable specs (same style) */}
              {expanded && (
                <>
<div className="spec-row">
  <div className="spec-item">
    <span className="spec-label">GPU Type</span>
    <span className="spec-value">
      {typeof specs.Platform?.gpu === "object"
        ? specs.Platform?.gpu?.["5G_variant"] ||
          specs.Platform?.gpu?.["4G_variant"] ||
          "N/A"
        : specs.Platform?.gpu || "N/A"}
    </span>
  </div>

  <div className="spec-item">
    <span className="spec-label">Available Colors</span>
    <span className="spec-value">
      {Array.isArray(specs["Body / Design"]?.colors_available)
        ? specs["Body / Design"]?.colors_available.join(", ")
        : specs["Body / Design"]?.colors_available || "N/A"}
    </span>
  </div>
</div>

<div className="spec-row">
<div className="spec-item">
  <span className="spec-label">Available Memory</span>
  <span className="spec-value">
    {(() => {
      const ram = specs.Memory?.ram_options;
      const storage = specs.Memory?.storage_options;

      // If both RAM + Storage are arrays, pair them
      if (Array.isArray(ram) && Array.isArray(storage)) {
        // Example: [4,6] RAM + [64,128] Storage → "4GB/64GB, 6GB/128GB"
        return ram
          .map((r, i) => `${r}GB / ${storage[i] ? storage[i] + "GB" : ""}`)
          .join(", ");
      }

      // If storage is array (numbers or strings)
      if (Array.isArray(storage)) {
        return storage.map(s => (typeof s === "number" ? `${s}GB` : s)).join(" / ");
      }

      // If storage is an object with 4G/5G variants
      if (typeof storage === "object") {
        return (
          storage?.["5G_variant"]?.join(" / ") ||
          storage?.["4G_variant"]?.join(" / ") ||
          "N/A"
        );
      }

      // Fallback: string or number
      return storage || "N/A";
    })()}
  </span>
</div>

  <div className="spec-item">
    <span className="spec-label">Dimensions (H/L/W)</span>
    <span className="spec-value">
      {typeof specs["Body / Design"]?.dimensions === "object"
        ? specs["Body / Design"]?.dimensions?.["5G_variant"] ||
          specs["Body / Design"]?.dimensions?.["4G_variant"] ||
          "N/A"
        : specs["Body / Design"]?.dimensions || "N/A"}
    </span>
  </div>
</div>

<div className="spec-row">
  <div className="spec-item">
    <span className="spec-label">Main Camera</span>
    <span className="spec-value">
      {typeof specs["Camera (Main)"]?.rear_camera_specs?.[0]?.megapixels ===
      "object"
        ? specs["Camera (Main)"]?.rear_camera_specs?.[0]?.megapixels?.[
            "5G_variant"
          ] ||
          specs["Camera (Main)"]?.rear_camera_specs?.[0]?.megapixels?.[
            "4G_variant"
          ] ||
          "N/A"
        : specs["Camera (Main)"]?.rear_camera_specs?.[0]?.megapixels || "N/A"}
      MP
    </span>
  </div>

  <div className="spec-item">
    <span className="spec-label">Selfie Camera</span>
    <span className="spec-value">
      {typeof specs["Camera (Front)"]?.front_camera_specs?.megapixels ===
      "object"
        ? specs["Camera (Front)"]?.front_camera_specs?.megapixels?.["5G_variant"] ||
          specs["Camera (Front)"]?.front_camera_specs?.megapixels?.["4G_variant"] ||
          "N/A"
        : specs["Camera (Front)"]?.front_camera_specs?.megapixels || "N/A"}
      MP
    </span>
  </div>
</div>

                </>
              )}
            </div>
          </div>
        </div>

        <div className="expand-section text-center mt-3">
          <button
            className="expand-btn btn btn-link"
            onClick={() => setExpanded((prev) => !prev)}
            onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          >
            {expanded ? "Collapse info ←" : "Expand info →"}
          </button>
        </div>
      </div>
    </div>
  );
}
