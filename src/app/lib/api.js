const API_URL = "/api/v1";

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from API server.");
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || "API request failed.");
  }

  return data;
}

export async function searchPhone(query) {
  const response = await fetch(
    `${API_URL}/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );

  return parseResponse(response);
}

export async function lookupPublicImei(imei) {
  const cleanImei = String(imei || "").replace(/\D/g, "");

  if (!/^\d{15}$/.test(cleanImei)) {
    throw new Error("IMEI must contain exactly 15 digits.");
  }

  const response = await fetch(
    `${API_URL}/public/imei/${cleanImei}`,
    { cache: "no-store" }
  );

  return parseResponse(response);
}

export { API_URL };
