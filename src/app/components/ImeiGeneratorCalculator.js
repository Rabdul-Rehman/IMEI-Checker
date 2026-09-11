"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "/api/v1";

export default function ImeiGeneratorCalculator() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBrands() {
      try {
        const response = await fetch(`${API_URL}/imei-generator/brands`);
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Failed to load brands");
        setBrands(result.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load brands");
      } finally {
        setLoading(false);
      }
    }
    loadBrands();
  }, []);

  return (
    <div className="generator-page">
      <div className="generator-shell">
        <div className="generator-hero">
          <span className="section-eyebrow">FREE ONLINE TOOL</span>
          <h1>Random IMEI Generator</h1>
          <p>Select a phone brand and model to generate test IMEI identifiers for development and application testing, using real TAC data from the database.</p>
        </div>

        {error && <div className="tool-error-box"><i className="fas fa-circle-exclamation" /> {error}</div>}
        {loading && <div className="generator-loading">Loading phone brands...</div>}

        {!loading && !error && (
          <>
            <div className="generator-toolbar"><span>{brands.length} brands available</span></div>
            <div className="generator-grid">
              {brands.map((brand) => {
                const brandName = brand.name || brand.brand_name || brand.title || "Unknown Brand";
                const brandId = brand.brand_id;
                return (
                  <Link key={brandId} href={`/imei-generator/${brandId}`} className="generator-brand-card">
                    <div className="generator-brand-icon"><i className="fas fa-mobile-screen-button" /></div>
                    <strong>{brandName}</strong>
                    <span>View models <i className="fas fa-arrow-right" /></span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
