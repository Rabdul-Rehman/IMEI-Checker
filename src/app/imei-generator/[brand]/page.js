"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export default function BrandModelsPage() {
  const params = useParams();

  // IMPORTANT:
  // This must be the numeric brand_id
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

        if (!brandId || !/^\d+$/.test(String(brandId))) {
          throw new Error("Invalid brand ID");
        }

        // Load models using NUMERIC brand_id
        const response = await fetch(
          `${API_URL}/imei-generator/brands/${brandId}/models`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load models"
          );
        }

        setModels(result.data || []);

        // Get brand name from first model if available
        if (result.data?.length > 0) {
          setBrandName(
            result.data[0].brand_name ||
              result.data[0].brands?.name ||
              "Brand"
          );
        }

      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load models");
      } finally {
        setLoading(false);
      }
    }

    loadModels();
  }, [brandId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "60px 5%",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/imei-generator"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          ← All brands
        </Link>

        <div
          style={{
            textAlign: "center",
            margin: "30px 0 45px",
          }}
        >
          <span
            style={{
              color: "#2563eb",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            IMEI GENERATOR
          </span>

          <h1
            style={{
              fontSize: "38px",
              color: "#111827",
              margin: "10px 0",
            }}
          >
            {brandName} IMEI Generator
          </h1>

          <p style={{ color: "#6b7280" }}>
            Select a {brandName} model to generate test IMEI numbers.
          </p>
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#6b7280",
            }}
          >
            Loading models...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "16px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "10px",
              textAlign: "center",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(230px, 1fr))",
              gap: "20px",
            }}
          >
            {models.map((model) => {
              const modelName =
                model.model_name ||
                model.name ||
                model.title ||
                "Unknown Model";

              /*
               * IMPORTANT:
               * Use phone_id in the URL.
               *
               * DO NOT use model.slug here because
               * the backend expects phoneId.
               */
              const phoneId = model.phone_id;

              return (
                <Link
                  key={phoneId}
                  href={`/imei-generator/${brandId}/${phoneId}`}
                  style={{
                    textDecoration: "none",
                    background: "#fff",
                    borderRadius: "14px",
                    padding: "25px",
                    minHeight: "130px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow:
                      "0 4px 18px rgba(15,23,42,.07)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#111827",
                        fontSize: "17px",
                        fontWeight: 700,
                        marginBottom: "10px",
                      }}
                    >
                      {modelName}
                    </div>

                    {model.model_number && (
                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        {model.model_number}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      marginTop: "18px",
                      background: "#2563eb",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: "7px",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Generate IMEI
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}