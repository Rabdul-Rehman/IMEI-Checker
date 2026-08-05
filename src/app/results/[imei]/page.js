"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { popularDevices } from "../../data/devices";

export default function ResultsPage() {
  const params = useParams();
  const imei = String(params.imei || "");
  const valid = /^\d{15}$/.test(imei);
  const tac = imei.slice(0, 8);
  const snr = imei.slice(8, 14);
  const cd = imei.slice(14);

  // Until Supabase is connected, keep this page completely local.
  const demoIndex = imei ? Number(imei.at(-1)) % popularDevices.length : 0;
  const device = popularDevices[demoIndex];

  if (!valid) {
    return <div className="result-empty"><i className="fas fa-triangle-exclamation" /><h1>Invalid IMEI</h1><p>Please enter a valid 15-digit IMEI number.</p><Link href="/">Back to IMEI Check</Link></div>;
  }

  return (
    <div className="result-page-modern">
      <section className="result-hero-modern">
        <span className="section-eyebrow">LOCAL LOOKUP</span>
        <div className="result-verified"><i className="fas fa-check" /> 15-digit IMEI format verified</div>
        <h1>IMEI <strong>Result</strong></h1>
        <p>This result screen is now running without an external API. The live device database will be connected through Supabase in the next phase.</p>
        <div className="result-code-grid"><div><strong>{tac}</strong><span>TAC</span></div><div><strong>{snr}</strong><span>SNR</span></div><div><strong>{cd}</strong><span>Check digit</span></div></div>
      </section>

      <section className="result-content-modern">
        <div className="result-device-card">
          <div className="result-device-image"><img src={device.image} alt={device.name} /></div>
          <div className="result-device-copy"><span className="device-modern-brand">LOCAL CATALOG PREVIEW</span><h2>{device.name}</h2><p>{device.brand} · Model {device.model}</p><div className="result-tags"><span>IMEI format valid</span><span>Catalog ready</span><span>Supabase next</span></div></div>
        </div>
        <div className="result-notice"><i className="fas fa-database" /><div><strong>Live database connection is not enabled yet.</strong><p>Your senior's Supabase database can replace this local preview later without bringing back the removed public API system.</p></div></div>
        <div className="result-actions"><Link href="/phones" className="outline-action">Browse phone database <i className="fas fa-arrow-right" /></Link><Link href="/carriers" className="outline-action">Browse carriers <i className="fas fa-arrow-right" /></Link><Link href="/" className="primary-action">Check another IMEI <i className="fas fa-arrow-right" /></Link></div>
      </section>
    </div>
  );
}
