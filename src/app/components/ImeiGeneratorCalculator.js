"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export default function ImeiGeneratorCalculator() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBrands() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/imei-generator/brands`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load brands"
          );
        }

        setBrands(result.data || []);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "Failed to load brands"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBrands();
  }, []);

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
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: "2px",
            }}
          >
            FREE ONLINE TOOL
          </span>

          <h1
            style={{
              fontSize: "42px",
              margin: "12px 0",
              color: "#111827",
            }}
          >
            Random IMEI Generator
          </h1>

          <p
            style={{
              maxWidth: "650px",
              margin: "0 auto",
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: 1.7,
            }}
          >
            Select a phone brand, choose a model, and generate
            valid test IMEI numbers for that device.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              padding: "16px 20px",
              marginBottom: "30px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#991b1b",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#6b7280",
            }}
          >
            Loading phone brands...
          </div>
        )}

        {/* BRANDS */}
        {!loading && !error && (
          <>
            <h2
              style={{
                fontSize: "24px",
                color: "#111827",
                marginBottom: "25px",
              }}
            >
              Select a brand
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {brands.map((brand) => {
                const brandName =
                  brand.name ||
                  brand.brand_name ||
                  brand.title ||
                  "Unknown Brand";

                // IMPORTANT:
                // Backend expects numeric brand_id.
                const brandId = brand.brand_id;

                return (
                  <Link
                    key={brandId}
                    href={`/imei-generator/${brandId}`}
                    style={{
                      textDecoration: "none",
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "28px 20px",
                      minHeight: "130px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow:
                        "0 4px 18px rgba(15, 23, 42, 0.08)",
                      border: "1px solid #e5e7eb",
                      transition: "0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "55px",
                        height: "55px",
                        borderRadius: "50%",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "15px",
                        color: "#2563eb",
                        fontSize: "22px",
                      }}
                    >
                      <i className="fas fa-mobile-screen-button" />
                    </div>

                    <strong
                      style={{
                        color: "#111827",
                        fontSize: "17px",
                      }}
                    >
                      {brandName}
                    </strong>

                    <span
                      style={{
                        marginTop: "8px",
                        color: "#2563eb",
                        fontSize: "13px",
                      }}
                    >
                      View models →
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}