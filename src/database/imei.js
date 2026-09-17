// Pure IMEI utilities for the database lookup layer.
// No UI dependencies.

export function normalizeImei(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function calculateImeiCheckDigit(first14) {
  const digits = String(first14 ?? "");
  if (!/^\d{14}$/.test(digits)) return null;

  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    let digit = Number(digits[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return String((10 - (sum % 10)) % 10);
}

export function isValidImei(value) {
  const imei = normalizeImei(value);
  if (!/^\d{15}$/.test(imei)) return false;
  return calculateImeiCheckDigit(imei.slice(0, 14)) === imei[14];
}

export function parseImei(value) {
  const imei = normalizeImei(value);
  const formatValid = /^\d{15}$/.test(imei);
  return {
    imei,
    formatValid,
    checksumValid: formatValid ? isValidImei(imei) : false,
    tac: formatValid ? imei.slice(0, 8) : null,
    serial: formatValid ? imei.slice(8, 14) : null,
    checkDigit: formatValid ? imei.slice(14) : null,
  };
}
