const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function loginUser({ userId, password, role }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, password, role }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Invalid credentials");
  }

  return res.json(); // { access_token, token_type, role, user_id, name }
}

export function saveSession(data) {
  localStorage.setItem("procify_token", data.access_token);
  localStorage.setItem("procify_user", JSON.stringify({
    role: data.role,
    id: data.user_id,
    name: data.name,
    company_name: data.company_name ?? "",
    company_id: data.company_id ?? "",
  }));
}

export function loadSession() {
  const token = localStorage.getItem("procify_token");
  const raw = localStorage.getItem("procify_user");
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("procify_token");
  localStorage.removeItem("procify_user");
}

export function getToken() {
  return localStorage.getItem("procify_token") ?? null;
}
