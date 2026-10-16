const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  description: string;
  transactionDate: string;
}

export interface Summary {
  income: number;
  expenses: number;
  balance: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    cache: 'no-store'
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getCategories: () => request<Category[]>('/categories'),
  getSummary: () => request<Summary>('/dashboard/summary'),
  getMonthly: () => request<MonthlySummary[]>('/dashboard/monthly'),
  getTransactions: (query = '') =>
    request<Transaction[]>(`/transactions${query ? `?${query}` : ''}`),
  createTransaction: (input: {
    type: TransactionType;
    amount: number;
    categoryId: number;
    description: string;
    transactionDate: string;
  }) => request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(input)
  }),
  deleteTransaction: (id: number) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' })
};
