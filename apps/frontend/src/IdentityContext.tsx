import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type Identity } from './workspace/api';
type Progress = { challenge_id: string; imported: number; verified: number; first_verified_at?: number; completed_attempts: number };
type Value = { identity: Identity | null; progress: Progress[]; progressState: 'loading'|'ready'|'unavailable'; refresh: () => Promise<void>; signOut: () => Promise<void> };
const Ctx = createContext<Value | null>(null);
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null); const [progress, setProgress] = useState<Progress[]>([]); const [progressState, setState] = useState<Value['progressState']>('loading'); const generation = useRef(0); const account = useRef<string | null>(null);
  const refresh = useCallback(async () => { const current = ++generation.current; setState('loading'); try { const found = await api<Identity>('/api/auth/me'); if (current !== generation.current) return; const nextAccount = found.user?.id || null; if (account.current !== nextAccount) { account.current = nextAccount; setProgress([]); } setIdentity(found); if (!found.user) { setState('ready'); return; } try { const data = await api<{ challenges: Progress[] }>('/api/progress'); if (current !== generation.current || account.current !== found.user.id) return; setProgress(data.challenges); setState('ready'); } catch { if (current === generation.current) setState('unavailable'); } } catch { if (current === generation.current) { account.current = null; setIdentity(null); setProgress([]); setState('unavailable'); } } }, []);
  useEffect(() => { void refresh(); const onFocus = () => { void refresh(); }; window.addEventListener('focus', onFocus); return () => { generation.current++; window.removeEventListener('focus', onFocus); }; }, [refresh]);
  const signOut = async () => { generation.current++; account.current = null; setIdentity(null); setProgress([]); setState('ready'); await api('/api/auth/logout', { method: 'POST' }); };
  const value = useMemo(() => ({ identity, progress, progressState, refresh, signOut }), [identity, progress, progressState]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useIdentity() { const v = useContext(Ctx); if (!v) throw new Error('IdentityProvider missing'); return v; }
