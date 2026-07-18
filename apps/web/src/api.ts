const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export type DashboardData = {
  summary: { incomeCents: number; expenseCents: number; netCents: number; pendingCount: number };
  chart: { month: string; value: number }[];
  recent: { id: string; transactionDate: string; label: string; kind: 'income' | 'expense'; amountCents: number; status: 'pending' | 'reconciled' | 'needs_review'; categoryName: string | null }[];
};

type LoginResponse = { token: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('paramecompta_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? 'Erreur API');
  return response.json() as Promise<T>;
}

export async function loginDemo(): Promise<void> {
  const result = await request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'demo@paramecompta.fr', password: 'Demo123!' }) });
  sessionStorage.setItem('paramecompta_token', result.token);
}

export async function getDashboard(): Promise<DashboardData> {
  try { return await request<DashboardData>('/dashboard'); }
  catch (error) {
    if (!sessionStorage.getItem('paramecompta_token')) { await loginDemo(); return request<DashboardData>('/dashboard'); }
    throw error;
  }
}
