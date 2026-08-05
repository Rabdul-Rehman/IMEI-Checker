"use client";

import { useMemo, useState } from "react";

const carriers = [
  { name: "AT&T", country: "United States", type: "Mobile network", code: "US", bands: "5G / 4G LTE" },
  { name: "Verizon", country: "United States", type: "Mobile network", code: "US", bands: "5G / 4G LTE" },
  { name: "T-Mobile", country: "United States", type: "Mobile network", code: "US", bands: "5G / 4G LTE" },
  { name: "Vodafone", country: "United Kingdom", type: "Mobile network", code: "GB", bands: "5G / 4G LTE" },
  { name: "EE", country: "United Kingdom", type: "Mobile network", code: "GB", bands: "5G / 4G LTE" },
  { name: "O2", country: "United Kingdom", type: "Mobile network", code: "GB", bands: "5G / 4G LTE" },
  { name: "Deutsche Telekom", country: "Germany", type: "Mobile network", code: "DE", bands: "5G / 4G LTE" },
  { name: "Orange", country: "France", type: "Mobile network", code: "FR", bands: "5G / 4G LTE" },
  { name: "Telefónica", country: "Spain", type: "Mobile network", code: "ES", bands: "5G / 4G LTE" },
  { name: "Telstra", country: "Australia", type: "Mobile network", code: "AU", bands: "5G / 4G LTE" },
  { name: "Rogers", country: "Canada", type: "Mobile network", code: "CA", bands: "5G / 4G LTE" },
  { name: "Airtel", country: "India", type: "Mobile network", code: "IN", bands: "5G / 4G LTE" },
  { name: "Jazz", country: "Pakistan", type: "Mobile network", code: "PK", bands: "4G LTE" },
  { name: "Zong", country: "Pakistan", type: "Mobile network", code: "PK", bands: "4G LTE / 5G" },
  { name: "Telenor", country: "Pakistan", type: "Mobile network", code: "PK", bands: "4G LTE" },
  { name: "Ufone", country: "Pakistan", type: "Mobile network", code: "PK", bands: "4G LTE" },
];

export default function CarriersPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("All");

  const countries = useMemo(() => ["All", ...Array.from(new Set(carriers.map((c) => c.country))).sort()], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return carriers.filter((carrier) => {
      const countryMatch = country === "All" || carrier.country === country;
      const queryMatch = !q || [carrier.name, carrier.country, carrier.code, carrier.bands].some((v) => v.toLowerCase().includes(q));
      return countryMatch && queryMatch;
    });
  }, [query, country]);

  return (
    <div className="modern-page-shell">
      <div className="modern-page-head database-head-row">
        <div>
          <span className="section-eyebrow">NETWORK DIRECTORY</span>
          <h1>Carriers Database</h1>
          <p>Find mobile network operators by carrier, country and network generation.</p>
        </div>
        <div className="database-head-stat"><strong>{carriers.length}</strong><span>Network entries</span></div>
      </div>

      <div className="carrier-summary-grid">
        <div><i className="fas fa-globe" /><strong>{countries.length - 1}</strong><span>Countries</span></div>
        <div><i className="fas fa-tower-cell" /><strong>{carriers.length}</strong><span>Operators</span></div>
        <div><i className="fas fa-signal" /><strong>5G</strong><span>Next-gen networks</span></div>
      </div>

      <div className="database-toolbar database-toolbar-enhanced">
        <div className="database-search">
          <i className="fas fa-magnifying-glass" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search carrier, country or code..." aria-label="Search carriers" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </div>
        <select className="database-sort" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Filter by country">
          {countries.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="database-result-line"><span>{filtered.length} carrier{filtered.length === 1 ? "" : "s"} shown</span></div>

      <div className="carrier-grid">
        {filtered.map((carrier) => (
          <article className="carrier-card carrier-card-enhanced" key={`${carrier.name}-${carrier.country}`}>
            <div className="carrier-card-top">
              <div className="carrier-logo"><i className="fas fa-tower-cell" /></div>
              <div><h3>{carrier.name}</h3><span className="carrier-country">{carrier.country} · {carrier.code}</span></div>
            </div>
            <div className="carrier-meta-row"><span>{carrier.type}</span><span>{carrier.bands}</span></div>
            <span className="carrier-badge"><i className="fas fa-circle-check" /> Network operator</span>
          </article>
        ))}
      </div>

      {!filtered.length && <div className="database-empty"><strong>No carrier matches</strong><span>Try another operator or country.</span></div>}
    </div>
  );
}
