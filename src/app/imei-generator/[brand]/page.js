"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL = "/api/v1";

export default function BrandModelsPage() {
  const params = useParams();

  const brandId = params.brand;

  const [models, setModels] = useState([]);
  const [brandName, setBrandName] = useState("Brand");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModels() {
      try {
        setLoading(true);
        setError("");

        if (
          !brandId ||
          !/^\d+$/.test(String(brandId))
        ) {
          throw new Error("Invalid brand ID");
        }

        const response = await fetch(
          `${API_URL}/imei-generator/brands/${brandId}/models`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load models"
          );
        }

        const modelList = result.data || [];

        setModels(modelList);

        if (modelList.length > 0) {
          setBrandName(
            modelList[0].brand_name ||
              modelList[0].brands?.name ||
              "Brand"
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          err.message || "Failed to load models"
        );
      } finally {
        setLoading(false);
      }
    }

    loadModels();
  }, [brandId]);

  return (
    <div className="modern-page-shell">
      <Link href="/imei-generator" className="generator-crumb">
        <i className="fas fa-arrow-left" /> All brands
      </Link>

      <div className="modern-page-head" style={{ textAlign: "center" }}>
        <span className="section-eyebrow" style={{ justifyContent: "center" }}>
          IMEI GENERATOR
        </span>
        <h1 style={{ margin: "12px auto" }}>{brandName} IMEI Generator</h1>
        <p style={{ margin: "0 auto" }}>
          Select a {brandName} model to generate test IMEI identifiers.
        </p>
      </div>

      {loading && (
        <div className="generator-select-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="generator-select-card" style={{ opacity: 0.5 }}>
              <div className="generator-select-icon">
                <i className="fas fa-mobile-screen-button" />
              </div>
              <strong>Loading…</strong>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="database-empty">
          <i className="fas fa-triangle-exclamation" />
          <strong>{error}</strong>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="database-result-line">
            <span>{models.length.toLocaleString()} model{models.length === 1 ? "" : "s"} available</span>
          </div>

          <div className="generator-select-grid">
            {models.map((model) => {
              const modelName =
                model.model_name ||
                model.name ||
                model.title ||
                "Unknown Model";

              const phoneId = model.phone_id;

              return (
                <Link
                  key={phoneId}
                  href={`/imei-generator/${brandId}/${phoneId}`}
                  className="generator-select-card"
                >
                  <div className="generator-select-icon">
                    <i className="fas fa-mobile-screen-button" />
                  </div>
                  <strong>{modelName}</strong>
                  {model.model_number && <small>{model.model_number}</small>}
                  <span className="generator-select-cta">
                    Generate IMEI <i className="fas fa-arrow-right" />
                  </span>
                </Link>
              );
            })}
          </div>

          {models.length === 0 && (
            <div className="database-empty">
              <i className="fas fa-mobile-screen-button" />
              <strong>No models available</strong>
              <span>No {brandName} models are currently in the database.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
