import { API_BASE } from '../types';
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: { error?: string }) { super(data.error || `Request failed (${status})`); this.status = status; this.data = data; }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_BASE + path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, signal: options.signal || AbortSignal.timeout(45000) });
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
export type Files = Record<string, string>;
export type Snapshot = { files: Files; revision: string };
export type Workspace = Snapshot & { id: string; challengeId: string; deadline: number; previewAvailable: boolean };
export type Identity = { user: { id: string; login: string } | null; executionEnabled: boolean; isAdmin?: boolean };
