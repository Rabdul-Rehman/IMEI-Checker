"use client";

import { useMemo, useState } from "react";

function calculateCheckDigit(base14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = Number(base14[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return String((10 - (sum % 10)) % 10);
}

export default function CalculatorPage() {
  const [value, setValue] = useState("");
  const clean = value.replace(/\D/g, "").slice(0, 14);
  const checkDigit = useMemo(() => clean.length === 14 ? calculateCheckDigit(clean) : "", [clean]);
  const fullImei = clean.length === 14 ? clean + checkDigit : "";

  return (
    <div className="calculator-page">
      <div className="calculator-shell">
        <div className="calculator-hero">
          <span className="section-eyebrow">IMEI TOOL</span>
          <h1>IMEI Calculator</h1>
          <p>Enter the first 14 digits of an IMEI and calculate the final Luhn check digit.</p>
        </div>

        <div className="calculator-card">
          <div className="tool-card-icon"><i className="fas fa-calculator" /></div>
          <h2>Calculate the check digit</h2>
          <p>The first 14 digits are used to calculate the 15th digit.</p>
          <label htmlFor="imei-base">14-digit IMEI base</label>
          <div className="calculator-input-wrap"><input id="imei-base" value={clean} onChange={(e) => setValue(e.target.value)} inputMode="numeric" maxLength={14} placeholder="e.g. 49015420323751" /><span>{clean.length}/14</span></div>

          <div className={`calculator-result ${fullImei ? "ready" : ""}`}>
            <span>Complete IMEI</span>
            <strong>{fullImei || "Enter 14 digits"}</strong>
            {fullImei && <small>Check digit: {checkDigit}</small>}
          </div>
        </div>

        <div className="calculator-help-grid">
          <div><span>01</span><h3>Enter 14 digits</h3><p>Do not include the final check digit.</p></div>
          <div><span>02</span><h3>Luhn calculation</h3><p>The IMEI check-digit algorithm processes the digits.</p></div>
          <div><span>03</span><h3>Use the result</h3><p>The calculated digit completes the 15-digit IMEI.</p></div>
        </div>
      </div>
    </div>
  );
}
