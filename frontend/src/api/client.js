// src/api/client.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

async function request(path, { method = "GET", body, headers = {}, credentials = "omit" } = {}) {
  if (!BASE_URL) {
    throw new Error("REACT_APP_API_BASE_URL is missing in frontend environment variables.");
  }

  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials,
  });

  const raw = await res.text();
  const contentType = res.headers.get("content-type") || "";

  let data = {};
  try {
    data = raw && contentType.includes("application/json") ? JSON.parse(raw) : { message: raw };
  } catch {
    data = { message: raw || "Invalid response from server" };
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  // ✅ Match backend routes
  studentLogin: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  studentSignup: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
};
