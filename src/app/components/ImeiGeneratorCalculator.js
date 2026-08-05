"use client";

import { useMemo, useState } from "react";

const MANUFACTURER_TACS = {
  Apple: ["35328910", "35284910", "35325611"],
  Samsung: ["35405211", "35479211", "35123411"],
  Google: ["35896511", "35897211"],
  Xiaomi: ["86234511", "86235911"],
};

function calculateLuhnCheckDigit(first14Digits) {
  let sum = 0;
  for (let i = 0; i < first14Digits.length; i++) {
    let digit = parseInt(first14Digits[first14Digits.length - 1 - i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

function randomDigits(length) {
  let result = "";
  for (let i = 0; i < length; i++) result += Math.floor(Math.random() * 10);
  return result;
}

function copyText(value) {
  if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(value);
}

export default function ImeiGeneratorCalculator() {
  const [manufacturer, setManufacturer] = useState("Apple");
  const [generatedImei, setGeneratedImei] = useState("");
  const [copied, setCopied] = useState("");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState("");

  const liveCheckDigit = useMemo(() => calcInput.length === 14 ? calculateLuhnCheckDigit(calcInput) : null, [calcInput]);

  const handleGenerate = () => {
    const tacOptions = MANUFACTURER_TACS[manufacturer] || ["35000000"];
    const tac = tacOptions[Math.floor(Math.random() * tacOptions.length)];
    const first14 = tac + randomDigits(6);
    setGeneratedImei(first14 + calculateLuhnCheckDigit(first14));
    setCopied("");
  };

  const handleCalculate = () => {
    const digits = calcInput.trim();
    if (!/^\d{14}$/.test(digits)) {
      setCalcError("Enter exactly 14 digits to calculate the final check digit.");
      setCalcResult(null);
      return;
    }
    setCalcError("");
    setCalcResult(digits + calculateLuhnCheckDigit(digits));
    setCopied("");
  };

  const luhnSteps = calcResult ? (() => {
    const digits = calcResult.slice(0, 14);
    const checkDigit = calcResult.slice(14);
    const doubled = [];
    for (let i = 0; i < digits.length; i++) {
      let d = parseInt(digits[digits.length - 1 - i], 10);
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      doubled.unshift(d);
    }
    const sum = doubled.reduce((a, b) => a + b, 0);
    return { doubled, sum, checkDigit, first8: digits.slice(0, 8), next6: digits.slice(8) };
  })() : null;

  const handleCopy = (value, label) => {
    copyText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1300);
  };

  return (
    <div className="modern-page-shell imei-calculator-page">
      <div className="modern-page-head">
        <span className="section-eyebrow">IMEI TOOLKIT</span>
        <h1>IMEI Calculator &amp; Generator</h1>
        <p>Calculate the Luhn check digit, generate test values for development, and understand how a 15-digit IMEI is structured.</p>
      </div>

      <div className="calculator-hero-grid">
        <div className="tool-card calculator-primary-card">
          <div className="tool-card-icon"><i className="fas fa-calculator" /></div>
          <h2>Calculate a check digit</h2>
          <p>Enter the first 14 digits. The calculator derives the final Luhn check digit and gives you the complete 15-digit value.</p>
          <label className="tool-label">First 14 digits</label>
          <div className="calculator-input-row">
            <input className="tool-input" inputMode="numeric" maxLength={14} value={calcInput} onChange={(e) => { setCalcInput(e.target.value.replace(/\D/g, "").slice(0, 14)); setCalcError(""); }} placeholder="35145120840121" />
            <span className="calculator-counter">{calcInput.length}/14</span>
          </div>
          <div className="calculator-live"><span>Live check digit</span><strong>{liveCheckDigit ?? "—"}</strong></div>
          <button type="button" className="tool-button" onClick={handleCalculate}><i className="fas fa-wand-magic-sparkles" /> Calculate full IMEI</button>
          {calcError && <div className="tool-error"><i className="fas fa-circle-exclamation" /> {calcError}</div>}
          {calcResult && <div className="tool-result tool-result-large"><span>Complete IMEI</span><strong>{calcResult}</strong><button type="button" onClick={() => handleCopy(calcResult, "calc")}>{copied === "calc" ? "Copied" : "Copy"}</button></div>}
        </div>

        <div className="tool-card generator-card">
          <div className="tool-card-icon"><i className="fas fa-mobile-screen-button" /></div>
          <h2>Generate a test IMEI</h2>
          <p>Choose a manufacturer to create a syntactically valid test value using a sample TAC and a calculated check digit.</p>
          <label className="tool-label">Manufacturer</label>
          <select className="tool-select" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)}>
            {Object.keys(MANUFACTURER_TACS).map((brand) => <option key={brand}>{brand}</option>)}
          </select>
          <button type="button" className="tool-button" onClick={handleGenerate}><i className="fas fa-shuffle" /> Generate test IMEI</button>
          {generatedImei && <div className="tool-result tool-result-large"><span>Generated value</span><strong>{generatedImei}</strong><button type="button" onClick={() => handleCopy(generatedImei, "generated")}>{copied === "generated" ? "Copied" : "Copy"}</button></div>}
        </div>
      </div>

      <div className="calculator-explain-grid">
        <div><span>01</span><h3>TAC</h3><p>The first 8 digits identify the device type allocation.</p></div>
        <div><span>02</span><h3>Serial number</h3><p>The following 6 digits identify the individual device sequence.</p></div>
        <div><span>03</span><h3>Check digit</h3><p>The final digit is calculated with the Luhn algorithm.</p></div>
      </div>

      <section className="calculator-detail-panel">
        <div><span className="section-eyebrow">HOW LUHN WORKS</span><h2>Validate the final digit in three steps</h2><p>Starting from the right, every second digit is doubled, digits are reduced when necessary, and the total is used to select a final digit that makes the sum divisible by 10.</p></div>
        <div className="step-explainer">
          <div className="step-explainer-card"><span>STEP 01</span><h3>Double alternating digits</h3><p>Work from the right side of the first 14 digits and double every second value.</p></div>
          <div className="step-explainer-card"><span>STEP 02</span><h3>Sum the result</h3><p>Add the transformed values together and inspect the remainder modulo 10.</p></div>
          <div className="step-explainer-card"><span>STEP 03</span><h3>Choose the check digit</h3><p>The final digit is the amount needed to reach the next multiple of ten.</p></div>
        </div>
      </section>

      {luhnSteps ? <div className="imei-steps-summary"><p>Transformed values: <strong>{luhnSteps.doubled.join(", ")}</strong></p><p>Sum: <strong>{luhnSteps.sum}</strong></p><p>Check digit: <strong>{luhnSteps.checkDigit}</strong></p><p>IMEI: <strong>{luhnSteps.first8}-{luhnSteps.next6}-{luhnSteps.checkDigit}</strong></p></div> : <div className="imei-steps-summary imei-steps-placeholder">Calculate an IMEI above to see the worked Luhn result.</div>}

      <div className="warning-modern"><i className="fas fa-triangle-exclamation" /> <span><strong>Educational / development use.</strong> Generated values are test data and are not intended to identify, unlock, clone or impersonate real devices.</span></div>
    </div>
  );
}
