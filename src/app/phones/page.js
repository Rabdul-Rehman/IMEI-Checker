"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import DevicePhoto from "../components/DevicePhoto";

export default function PhoneDatabasePage() {
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState(["All"]);
  const [query, setQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPhones() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("phones")
        .select(`
          phone_id,
          model_name,
          slug,
          specs_json,
          brand_id,
          brands (
            brand_id,
            name
          )
        `)
        .order("model_name", { ascending: true });

      if (error) {
        console.error("Supabase phones error:", error);
        setError("Unable to load phone database.");
        setLoading(false);
        return;
      }

      const formatted = (data || []).map((phone) => ({
        ...phone,
        brand: phone.brands?.name || "Unknown",
        image: getPhoneImage(phone),
      }));

      setPhones(formatted);

      const uniqueBrands = [
        "All",
        ...Array.from(new Set(formatted.map((p) => p.brand))).sort(),
      ];

      setBrands(uniqueBrands);
      setLoading(false);
    }

    loadPhones();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const result = phones.filter((phone) => {
      const brandMatch =
        activeBrand === "All" || phone.brand === activeBrand;

      const queryMatch =
        !normalized ||
        phone.model_name?.toLowerCase().includes(normalized) ||
        phone.brand?.toLowerCase().includes(normalized) ||
        phone.slug?.toLowerCase().includes(normalized);

      return brandMatch && queryMatch;
    });

    return [...result].sort((a, b) => {
      if (sort === "brand") {
        return (
          a.brand.localeCompare(b.brand) ||
          a.model_name.localeCompare(b.model_name)
        );
      }

      return a.model_name.localeCompare(b.model_name);
    });
  }, [phones, query, activeBrand, sort]);

  return (
    <div className="modern-page-shell">
      <div className="modern-page-head database-head-row">
        <div>
          <span className="section-eyebrow">DEVICE DIRECTORY</span>

          <h1>Phone Database</h1>

          <p>
            Explore phones, compare specifications and open a dedicated
            device profile.
          </p>
        </div>

        <div className="database-head-stat">
          <strong>{phones.length.toLocaleString()}</strong>
          <span>Devices available</span>
        </div>
      </div>

      <div className="database-toolbar database-toolbar-enhanced">
        <div className="database-search">
          <i className="fas fa-magnifying-glass" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone, brand or model..."
            aria-label="Search phones"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="database-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort phones"
        >
          <option value="name">Name A-Z</option>
          <option value="brand">Brand A-Z</option>
        </select>
      </div>

      <div className="filter-pills">
        {brands.slice(0, 20).map((brand) => (
          <button
            key={brand}
            type="button"
            className={activeBrand === brand ? "active" : ""}
            onClick={() => setActiveBrand(brand)}
          >
            {brand}
          </button>
        ))}
      </div>

      <div className="database-result-line">
        <span>
          {loading
            ? "Loading devices..."
            : `${filtered.length.toLocaleString()} model${
                filtered.length === 1 ? "" : "s"
              } found`}
        </span>

        {(query || activeBrand !== "All") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveBrand("All");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="database-empty">
          <i className="fas fa-triangle-exclamation" />
          <strong>{error}</strong>
          <span>
            Check your Supabase connection and table permissions.
          </span>
        </div>
      )}

      {loading && !error && (
        <div className="database-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="database-card database-card-enhanced"
              style={{ minHeight: "280px" }}
            >
              <div
                style={{
                  height: "150px",
                  borderRadius: "14px",
                  background: "#f3f4f6",
                  marginBottom: "18px",
                }}
              />

              <div
                style={{
                  height: "12px",
                  width: "35%",
                  background: "#f3f4f6",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />

              <div
                style={{
                  height: "18px",
                  width: "70%",
                  background: "#f3f4f6",
                  borderRadius: "8px",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="database-grid">
          {filtered.map((phone) => (
            <Link
              href={`/phones/${phone.slug}`}
              key={phone.phone_id}
              className="database-card database-card-enhanced"
            >
              <div className="database-card-icon">
                <DevicePhoto
                  src={phone.image}
                  alt={phone.model_name}
                />
              </div>

              <span className="brand">{phone.brand}</span>

              <h3>{phone.model_name}</h3>

              <p>
                {getShortSpecs(phone.specs_json)}
              </p>

              <span className="database-card-link">
                View full specs{" "}
                <i className="fas fa-arrow-right" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="database-empty">
          <i className="fas fa-mobile-screen-button" />
          <strong>No devices found</strong>
          <span>
            Try another phone model or brand.
          </span>
        </div>
      )}
    </div>
  );
}

function getPhoneImage(phone) {
  const slug = phone.slug || "";

  const knownImages = {
    "iphone-17-pro": "/images/devices/iphone-17-pro.png",
    "galaxy-s25-ultra": "/images/devices/galaxy-s25-ultra.png",
    "pixel-10-pro": "/images/devices/pixel-10-pro.png",
    "xiaomi-15-ultra": "/images/devices/xiaomi-15-ultra.png",
  };

  return knownImages[slug] || "/images/devices/phone-placeholder.png";
}

function getShortSpecs(specs) {
  if (!specs) return "Specifications available";

  const display = specs.Display;
  const platform = specs.Platform;
  const camera = specs["Camera (Main)"];

  const parts = [];

  if (display?.display_size_inches) {
    parts.push(`${display.display_size_inches}" display`);
  }

  if (platform?.chipset) {
    parts.push(platform.chipset);
  }

  if (camera?.rear_camera_count) {
    parts.push(`${camera.rear_camera_count} cameras`);
  }

  return parts.length
    ? parts.join(" • ")
    : "Specifications available";
}