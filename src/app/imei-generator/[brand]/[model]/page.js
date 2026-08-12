"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export default function DeviceImeiGeneratorPage() {
  const params = useParams();

  const brandId = params.brand;
  const phoneId = params.model;

  const [device, setDevice] = useState(null);
  const [count, setCount] = useState(1);
  const [imeis, setImeis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedImei, setCopiedImei] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    async function loadDevice() {
      try {
        setLoading(true);
        setError("");

        if (!phoneId || !/^\d+$/.test(String(phoneId))) {
          throw new Error("Invalid phone ID");
        }

        const response = await fetch(
          `${API_URL}/imei-generator/phones/${phoneId}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load device"
          );
        }

        setDevice(result.data);
      } catch (err) {
        console.error(err);

        setError(
          err.message || "Failed to load device"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDevice();
  }, [phoneId]);

  async function generateImeis() {
    if (!device?.phone_id) {
      setError("Phone information is missing.");
      return;
    }

    if (!device?.can_generate) {
      setError(
        "IMEI generation is not available for this model because no TAC is mapped to it."
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setImeis([]);
      setCopiedImei("");
      setCopiedAll(false);

      const response = await fetch(
        `${API_URL}/imei-generator/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_id: device.phone_id,
            count: Math.min(
              Math.max(Number(count), 1),
              10
            ),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to generate IMEIs"
        );
      }

      setImeis(result.data?.imeis || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to generate IMEIs"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function copyImei(imei) {
    try {
      await navigator.clipboard.writeText(imei);

      setCopiedImei(imei);

      setTimeout(() => {
        setCopiedImei("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Unable to copy IMEI.");
    }
  }

  async function copyAllImeis() {
    try {
      await navigator.clipboard.writeText(imeis.join("\n"));

      setCopiedAll(true);

      setTimeout(() => {
        setCopiedAll(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Unable to copy IMEIs.");
    }
  }

  const modelName =
    device?.model_name || "Unknown Model";

  const brandName =
    device?.brand?.name ||
    device?.brand_name ||
    "Brand";

  const canGenerate = Boolean(device?.can_generate);

  if (loading) {
    return (
      <div className="modern-page-shell" style={{ textAlign: "center" }}>
        <span className="section-eyebrow" style={{ justifyContent: "center" }}>
          IMEI GENERATOR
        </span>
        <p style={{ marginTop: "14px", color: "#7f8997" }}>Loading device…</p>
      </div>
    );
  }

  if (error && !device) {
    return (
      <div className="modern-page-shell">
        <div className="database-empty">
          <i className="fas fa-triangle-exclamation" />
          <strong>{error}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-page-shell">
      <Link href={`/imei-generator/${brandId}`} className="generator-crumb">
        <i className="fas fa-arrow-left" /> Back to {brandName} models
      </Link>

      <div className="generator-tool-card">
        <div className="generator-tool-head">
          <span className="section-eyebrow" style={{ justifyContent: "center" }}>
            IMEI GENERATOR
          </span>
          <h1>{modelName}</h1>
          <p>Generate valid IMEI numbers for this device model.</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: "20px" }}>{error}</div>}

        {!canGenerate && (
          <div className="warning-modern" style={{ marginBottom: "22px", textAlign: "center" }}>
            <strong>IMEI generation is not available for this model.</strong>
            <div style={{ marginTop: "5px" }}>
              No TAC is currently mapped to this device in the database.
            </div>
          </div>
        )}

        <div className="generator-controls">
          <div>
            <label className="tool-label">Number of IMEIs</label>
            <select
              className="tool-select"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ minWidth: "170px" }}
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
                <option key={number} value={number}>
                  {number} IMEI{number > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="tool-button"
            onClick={generateImeis}
            disabled={generating || !canGenerate}
            style={{ width: "auto", padding: "0 26px", height: "46px" }}
          >
            <i className="fas fa-arrows-rotate" /> {generating ? "Generating…" : "Generate IMEI"}
          </button>
        </div>

        {imeis.length > 0 && (
          <div className="imei-result-list">
            <div className="imei-result-note">
              <i className="fas fa-circle-check" />
              These IMEIs were generated using the real database TAC mapped to this device.
            </div>

            {imeis.map((imei, index) => (
              <div className="imei-result-row" key={`${imei}-${index}`}>
                <span className="imei-result-index">#{index + 1}</span>
                <span className="imei-result-value">{imei}</span>
                <button
                  type="button"
                  className={`imei-result-copy${copiedImei === imei ? " copied" : ""}`}
                  onClick={() => copyImei(imei)}
                >
                  {copiedImei === imei ? "Copied" : "Copy"}
                </button>
              </div>
            ))}

            <button type="button" className="tool-button generator-copy-all" onClick={copyAllImeis}>
              <i className="fas fa-copy" /> {copiedAll ? "Copied all IMEIs" : "Copy all IMEIs"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
