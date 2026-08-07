const API_URL = "http://127.0.0.1:8000/api/v1";

export async function searchPhone(query) {
  const response = await fetch(
    `${API_URL}/search?q=${encodeURIComponent(query)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Search failed");
  }

  return data;
}