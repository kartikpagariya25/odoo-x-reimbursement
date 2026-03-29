const BASE ="http://localhost:5000/api";

const authHeaders = () => {
  const raw = localStorage.getItem("auth-storage");
  const token = raw ? JSON.parse(raw)?.state?.token : null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers = async () => {
  const res = await fetch(`${BASE}/users`, { headers: authHeaders() });
  return res.json();
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  managerId?: string;
}) => {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateUser = async (
  id: string,
  data: { name?: string; role?: string; managerId?: string }
) => {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteUser = async (id: string) => {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const getAllExpenses = async (params?: {
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  search?: string;
}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v && v !== "ALL")
    )
  ).toString();
  const res = await fetch(`${BASE}/expenses/all${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const overrideExpense = async (
  id: string,
  data: { action: "APPROVED" | "REJECTED"; comment?: string }
) => {
  const res = await fetch(`${BASE}/expenses/${id}/override`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ─── Approval Rules ──────────────────────────────────────────────────────────

export const getAllRules = async () => {
  const res = await fetch(`${BASE}/rules`, { headers: authHeaders() });
  return res.json();
};

export const createRule = async (data: unknown) => {
  const res = await fetch(`${BASE}/rules`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateRule = async (id: string, data: unknown) => {
  const res = await fetch(`${BASE}/rules/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteRule = async (id: string) => {
  const res = await fetch(`${BASE}/rules/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};