"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { popularDevices } from "../data/devices";
import DevicePhoto from "../components/DevicePhoto";

export default function PhoneDatabasePage() {
  const [query, setQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");

  const brands = useMemo(() => {
    const unique = Array.from(
      new Set(popularDevices.map((d) => d.brand))
    );
    return ["All", ...unique];
  }, []);

  const filteredDevices = useMemo(() => {
    return popularDevices.filter((device) => {
      const matchesBrand =
        activeBrand === "All" || device.brand === activeBrand;
      const matchesQuery =
        query.trim() === "" ||
        device.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        device.brand.toLowerCase().includes(query.trim().toLowerCase());
      return matchesBrand && matchesQuery;
    });
  }, [query, activeBrand]);

  return (
    <div className="container-fluid phone-db-page">
      <h1 className="phone-db-title">Phone Database</h1>
      <p className="phone-db-subtitle">
        Explore 15,000+ devices in our complete mobile catalog.
      </p>

      {/* Search */}
      <div className="phone-db-search">
        <input
          type="text"
          className="phone-db-search-input"
          placeholder="Search brand or model..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <i className="fas fa-magnifying-glass phone-db-search-icon"></i>
      </div>

      {/* Brand filter pills */}
      <div className="phone-db-filters">
        {brands.map((brand) => (
          <button
            key={brand}
            type="button"
            className={`phone-db-pill ${
              activeBrand === brand ? "active" : ""
            }`}
            onClick={() => setActiveBrand(brand)}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Device grid */}
      <div className="row gy-4">
        {filteredDevices.map((device) => {
          const listSummary = `${device.model} • ${device.keySpecs[0].value} • ${device.keySpecs[1].value} • ${device.keySpecs[2].value.split(" ")[0]}`;
          return (
            <div className="col-6 col-md-4" key={device.slug}>
              <Link
                href={`/phones/${device.slug}`}
                className="device-card-link"
              >
                <div className="device-card">
                  <div className="device-photo">
                    <DevicePhoto src={device.image} alt={device.name} />
                  </div>
                  <div className="device-brand">{device.brand}</div>
                  <h3 className="device-name">{device.name}</h3>
                  <p className="device-specs">{listSummary}</p>
                </div>
              </Link>
            </div>
          );
        })}

        {filteredDevices.length === 0 && (
          <p className="phone-db-empty">No devices match your search.</p>
        )}
      </div>
    </div>
  );
}
