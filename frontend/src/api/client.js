// src/api/client.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

async function request(path, { method = "GET", body, headers = {}, credentials = "omit" } = {}) {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials, // use "include" only if using cookies
  });

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text(); // ✅ prevents json() crash

  let data = null;
  if (raw) {
    try {
      data = contentType.includes("application/json") ? JSON.parse(raw) : raw;
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export const api = {
  studentLogin: (payload) => request("/api/auth/student/login", { method: "POST", body: payload }),
  studentSignup: (payload) => request("/api/auth/student/signup", { method: "POST", body: payload }),
};
