"use client";

import { useState } from "react";

const MANUFACTURER_TACS = {
  Apple: ["35328910", "35284910", "35325611"],
  Samsung: ["35405211", "35479211", "35123411"],
  Google: ["35896511", "35897211"],
  Xiaomi: ["86234511", "86235911"],
};

// Luhn check digit calculation
function calculateLuhnCheckDigit(first14Digits) {
  let sum = 0;
  // Process digits right to left; double every 2nd digit (odd positions from right, 0-indexed)
  for (let i = 0; i < first14Digits.length; i++) {
    let digit = parseInt(first14Digits[first14Digits.length - 1 - i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

function randomDigits(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

export default function ImeiGeneratorCalculator() {
  const [manufacturer, setManufacturer] = useState("Apple");
  const [generatedImei, setGeneratedImei] = useState("");

  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState("");

  const handleGenerate = () => {
    const tacOptions = MANUFACTURER_TACS[manufacturer] || ["35000000"];
    const tac = tacOptions[Math.floor(Math.random() * tacOptions.length)];
    const serial = randomDigits(6);
    const first14 = tac + serial;
    const checkDigit = calculateLuhnCheckDigit(first14);
    setGeneratedImei(first14 + checkDigit);
  };

  const handleCalculate = () => {
    const digits = calcInput.trim();
    if (!/^\d{14}$/.test(digits)) {
      setCalcError("Please enter exactly 14 digits.");
      setCalcResult(null);
      return;
    }
    setCalcError("");
    const checkDigit = calculateLuhnCheckDigit(digits);
    setCalcResult(digits + checkDigit);
  };

  const luhnSteps = calcResult
    ? (() => {
        const digits = calcResult.slice(0, 14);
        const checkDigit = calcResult.slice(14);
        const doubled = [];
        for (let i = 0; i < digits.length; i++) {
          let d = parseInt(digits[digits.length - 1 - i], 10);
          if (i % 2 === 0) {
            d *= 2;
            if (d > 9) d -= 9;
          }
          doubled.unshift(d);
        }
        const original = digits
          .split("")
          .map((d, i) => (i % 2 === 0 ? `${d}x2` : `${d}x1`))
          .join(", ");
        const sum = doubled.reduce((a, b) => a + b, 0);
        return {
          doubledLine: `(${original}) = (${doubled.join(", ")})`,
          sumLine: `Sum of digits = ${sum}`,
          checkDigit,
          first8: digits.slice(0, 8),
          next6: digits.slice(8),
        };
      })()
    : null;

  return (
    <div className="container-fluid imei-gen-page">
      <h1 className="imei-gen-title">IMEI Generator &amp; Calculator</h1>
      <p className="imei-gen-subtitle">
        Generate test IMEIs and calculate check digits using the Luhn
        algorithm.
      </p>

      {/* Generator card */}
      <div className="imei-gen-card">
        <h2 className="imei-gen-card-title">Generate Test IMEI</h2>

        <label className="imei-gen-label">Manufacturer</label>
        <select
          className="imei-gen-select"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        >
          {Object.keys(MANUFACTURER_TACS).map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="imei-gen-btn"
          onClick={handleGenerate}
        >
          Generate Test IMEI
        </button>

        {generatedImei && (
          <div className="imei-gen-result">
            Generated IMEI: <span>{generatedImei}</span>
          </div>
        )}
      </div>

      {/* Calculator card */}
      <div className="imei-gen-card">
        <h2 className="imei-gen-card-title">IMEI Calculator</h2>
        <p className="imei-gen-card-desc">
          The last number of the IMEI is a check digit. The Check Digit is
          calculated according to Luhn formula.
        </p>

        <label className="imei-gen-label">Enter first 14 digits of IMEI</label>
        <div className="imei-calc-row">
          <input
            type="text"
            maxLength={14}
            className="imei-gen-input"
            placeholder="e.g. 35145120840121"
            value={calcInput}
            onChange={(e) => setCalcInput(e.target.value.replace(/\D/g, ""))}
          />
          <button
            type="button"
            className="imei-calc-btn"
            onClick={handleCalculate}
          >
            Calculate
          </button>
        </div>

        {calcError && <div className="imei-gen-error">{calcError}</div>}
        {calcResult && (
          <div className="imei-gen-result">
            Full IMEI: <span>{calcResult}</span>
          </div>
        )}
      </div>

      {/* Step-by-step Luhn explainer */}
      <h2 className="imei-gen-section-title">
        The check digit is validated in three steps:
      </h2>
      <div className="row gy-3 imei-steps-row">
        <div className="col-md-4">
          <div className="imei-step-card">
            <div className="imei-step-title">Step 1</div>
            <div className="imei-step-icon">
              <i className="fas fa-clone"></i>
            </div>
            <div className="imei-step-tag">DOUBLE DIGITS</div>
            <p className="imei-step-text">
              Starting from the right, double a digit every two digits (e.g.,
              5 → 10).
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="imei-step-card imei-step-card-active">
            <div className="imei-step-title">Step 2</div>
            <div className="imei-step-icon">
              <i className="fas fa-calculator"></i>
            </div>
            <div className="imei-step-tag">SUM THE DIGITS</div>
            <p className="imei-step-text">
              Sum the digits (e.g., 10 → 1+0). Check if the sum is divisible
              by 10.
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="imei-step-card">
            <div className="imei-step-title">Step 3</div>
            <div className="imei-step-icon">
              <i className="fas fa-hexagon"></i>
            </div>
            <div className="imei-step-tag">CHOOSE THE DIGIT</div>
            <p className="imei-step-text">
              Conversely, one can calculate the IMEI by choosing the check
              digit that would give a sum divisible by 10.
            </p>
          </div>
        </div>
      </div>

      {luhnSteps ? (
        <div className="imei-steps-summary">
          <p>{luhnSteps.doubledLine}</p>
          <p>{luhnSteps.sumLine}</p>
          <p>
            Luhn Digit : <strong>{luhnSteps.checkDigit}</strong>
          </p>
          <p>
            IMEI:{" "}
            <strong>
              {luhnSteps.first8}-{luhnSteps.next6}-{luhnSteps.checkDigit}
            </strong>
          </p>
        </div>
      ) : (
        <div className="imei-steps-summary imei-steps-placeholder">
          <p>
            Use the calculator above with a 14-digit IMEI to see this
            worked example.
          </p>
        </div>
      )}

      {/* Educational use warning */}
      <div className="imei-gen-warning">
        <i className="fas fa-triangle-exclamation"></i>
        <div>
          <div className="imei-gen-warning-title">Educational Use Only</div>
          <div className="imei-gen-warning-text">
            Generated values are for testing and educational use only. Not
            intended to identify or impersonate real devices.
          </div>
        </div>
      </div>

      {/* How IMEI Works */}
      <h2 className="imei-gen-section-title">How IMEI Works</h2>
      <div className="row gy-3">
        <div className="col-md-4">
          <div className="imei-gen-info-card">
            <div className="imei-gen-info-code">TAC</div>
            <div className="imei-gen-info-name">Type Allocation Code</div>
            <div className="imei-gen-info-sub">8 digits</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="imei-gen-info-card">
            <div className="imei-gen-info-code">SNR</div>
            <div className="imei-gen-info-name">Serial Number</div>
            <div className="imei-gen-info-sub">6 digits</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="imei-gen-info-card">
            <div className="imei-gen-info-code">CD</div>
            <div className="imei-gen-info-name">Check Digit</div>
            <div className="imei-gen-info-sub">1 digit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
