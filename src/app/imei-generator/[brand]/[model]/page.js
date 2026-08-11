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

  useEffect(() => {
    async function loadDevice() {
      try {
        setLoading(true);
        setError("");

        if (!phoneId || !/^\d+$/.test(String(phoneId))) {
          throw new Error("Invalid phone ID");
        }

        /*
         * IMPORTANT:
         *
         * Backend route:
         *
         * GET /imei-generator/phones/:phoneId
         *
         * Therefore we send phoneId here.
         */
        const response = await fetch(
          `${API_URL}/imei-generator/phones/${phoneId}`
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

    try {
      setGenerating(true);
      setError("");
      setImeis([]);

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

      /*
       * Backend returns:
       *
       * {
       *   success: true,
       *   data: {
       *      phone_id,
       *      brand,
       *      model_name,
       *      tac,
       *      count,
       *      imeis
       *   }
       * }
       */

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

  function copyImei(imei) {
    navigator.clipboard.writeText(imei);
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "80px 5%",
          textAlign: "center",
          background: "#f8fafc",
        }}
      >
        Loading device...
      </main>
    );
  }

  if (error && !device) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "80px 5%",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "20px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      </main>
    );
  }

  const modelName =
    device?.model_name || "Unknown Model";

  const brandName =
    device?.brand?.name ||
    device?.brand_name ||
    "Brand";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "50px 5%",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link
          href={`/imei-generator/${brandId}`}
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          ← Back to {brandName} models
        </Link>

        <section
          style={{
            marginTop: "30px",
            background: "#fff",
            borderRadius: "18px",
            padding: "40px",
            boxShadow:
              "0 8px 30px rgba(15,23,42,.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
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
              RANDOM IMEI GENERATOR
            </span>

            <h1
              style={{
                fontSize: "36px",
                color: "#111827",
                margin: "10px 0",
              }}
            >
              {modelName}
            </h1>

            <p style={{ color: "#6b7280" }}>
              Generate test IMEI numbers specifically for this
              device.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "14px",
                marginBottom: "20px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "end",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Number of IMEIs
              </label>

              <select
                value={count}
                onChange={(e) =>
                  setCount(Number(e.target.value))
                }
                style={{
                  height: "46px",
                  minWidth: "150px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                }}
              >
                {Array.from(
                  { length: 10 },
                  (_, index) => index + 1
                ).map((number) => (
                  <option
                    key={number}
                    value={number}
                  >
                    {number} IMEI
                    {number > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={generateImeis}
              disabled={generating}
              style={{
                height: "46px",
                padding: "0 24px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                cursor: generating
                  ? "not-allowed"
                  : "pointer",
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating
                ? "Generating..."
                : "Generate IMEI"}
            </button>
          </div>

          {!device?.can_generate && (
            <div
              style={{
                marginTop: "25px",
                padding: "15px",
                background: "#fff7ed",
                color: "#9a3412",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              IMEI generation is not available for this
              model yet because no TAC is mapped to it.
            </div>
          )}

          {imeis.length > 0 && (
            <div style={{ marginTop: "35px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  color: "#111827",
                  marginBottom: "15px",
                }}
              >
                Generated IMEIs
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {imeis.map((imei, index) => (
                  <div
                    key={`${imei}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "15px",
                      padding: "15px 18px",
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "9px",
                    }}
                  >
                    <span
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      #{index + 1}
                    </span>

                    <strong
                      style={{
                        flex: 1,
                        color: "#111827",
                        fontSize: "16px",
                        letterSpacing: "1px",
                      }}
                    >
                      {imei}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        copyImei(imei)
                      }
                      style={{
                        border: "none",
                        background: "#e0ecff",
                        color: "#2563eb",
                        padding: "8px 12px",
                        borderRadius: "7px",
                        cursor: "pointer",
                      }}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}