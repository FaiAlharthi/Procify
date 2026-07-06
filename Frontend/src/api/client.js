import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail;
    try {
      detail = (await res.json())?.detail;
    } catch {
      /* no JSON body */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: "DELETE" }),
};

export { BASE_URL };
