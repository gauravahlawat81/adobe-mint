import { loadSession } from './session';
import { BACKEND_URL } from '../config';

async function authHeaders(): Promise<Record<string, string>> {
  const session = await loadSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...headers, ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected';
  thumbnail_uri: string | null;
  earnings: number;
  downloads: number;
  requiresReview: boolean;
  reviewReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface Stats {
  totalEarnings: number;
  totalDownloads: number;
  approvedCount: number;
  reviewingCount: number;
  totalCount: number;
  monthly: Array<{ month: string; year_month: string; amount: number }>;
}

export const getSubmissions = () => apiFetch<Submission[]>('/api/submissions');
export const getStats       = () => apiFetch<Stats>('/api/stats');

// Returns the SHA-256 hashes of all photos this user has already uploaded.
// Used to filter duplicates out of the swipe queue before scanning.
export const getSubmissionHashes = () => apiFetch<string[]>('/api/submissions/hashes');

export function postSubmission(body: {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  thumbnail_uri: string | null;
  requires_review: boolean;
  review_reason: string | null;
  photo_hash: string | null;
}) {
  return apiFetch<{ id: string; status: string }>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Edit metadata on an already-uploaded submission.
export function updateSubmission(id: string, body: {
  title: string;
  description: string;
  keywords: string[];
  category: string;
}) {
  return apiFetch<{ id: string; updated: boolean }>(`/api/submissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// Permanently delete an uploaded submission.
export function deleteSubmission(id: string) {
  return apiFetch<{ id: string; deleted: boolean }>(`/api/submissions/${id}`, {
    method: 'DELETE',
  });
}
