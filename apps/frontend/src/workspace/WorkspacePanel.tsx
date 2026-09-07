import { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { API_BASE } from '../types';
import { api, ApiError, type Files, type Identity, type Snapshot, type Workspace } from './api';
import { mergeFiles, sameFiles } from './merge';
const Terminal = lazy(() => import('./Terminal'));
import './workspace.css';
export type WorkspaceHandle = { flush: () => Promise<Files> };
type Props = { challengeId: string; files: Files; setFiles: (files: Files) => void };
const WorkspacePanel = forwardRef<WorkspaceHandle, Props>(function WorkspacePanel({ challengeId, files, setFiles }, ref) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Draft saved in this browser');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [tab, setTab] = useState<'terminal' | 'preview'>('terminal');
  const [preview, setPreview] = useState('');
  const [previewStatus, setPreviewStatus] = useState('Stopped');
  const current = useRef(files);
  useLayoutEffect(() => { current.current = files; }, [files]);
  const base = useRef<Snapshot | null>(null);
  const live = useRef<Workspace | null>(null);
  const conflictRef = useRef<string[]>([]);
  const queue = useRef(Promise.resolve());
  const mounted = useRef(true);
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.current.then(operation);
    queue.current = result.then(() => {}, () => {}); return result;
  }
  function applyRemote(remote: Snapshot) {
    const merged = mergeFiles(base.current?.files || {}, current.current, remote.files);
    const pending = [...new Set([...conflictRef.current, ...merged.conflicts])];
    base.current = remote; current.current = merged.files;
    conflictRef.current = pending; setConflicts(pending); setFiles(merged.files);
    return pending;
  }
  async function synchronize(forceRead = false): Promise<Files> {
    return serialized(async () => {
      const session = live.current;
      if (!session) return current.current;
      if (conflictRef.current.length) throw new Error('Resolve file conflicts before running commands');
      if (!forceRead && base.current && sameFiles(current.current, base.current.files)) return current.current;
      try {
        const remote = await api<Snapshot>(`/api/workspaces/${session.id}/files`);
        if (!mounted.current) return current.current;
        if (applyRemote(remote).length) throw new Error('Editor and terminal changed the same files');
        if (!sameFiles(current.current, remote.files)) {
          setSaveStatus('Saving…');
          const sent = { ...current.current };
          const saved = await api<Snapshot>(`/api/workspaces/${session.id}/files`, { method: 'PUT', body: JSON.stringify({ files: sent, revision: remote.revision }) });
          // Edits typed during the request remain dirty and are saved next time.
          base.current = { files: sent, revision: remote.revision };
          applyRemote(saved);
        }
        setSaveStatus('Saved to workspace'); return current.current;
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 409) applyRemote(caught.data as Snapshot);
        if (caught instanceof ApiError && [404, 410].includes(caught.status)) { live.current = null; setWorkspace(null); setPreview(''); setSaveStatus('Workspace expired; draft retained'); }
        throw caught;
      }
    });
  }
  const operations = useRef({ synchronize });
  useLayoutEffect(() => { operations.current = { synchronize }; });
  useImperativeHandle(ref, () => ({ flush: () => operations.current.synchronize(true) }), []);
  useEffect(() => {
    mounted.current = true;
    api<Identity>('/api/auth/me').then(async found => {
      if (!mounted.current) return;
      setIdentity(found);
      if (found.user) {
        const existing = await api<{ workspaces: Workspace[] }>('/api/workspaces');
        const match = existing.workspaces.find(item => item.challengeId === challengeId);
        if (match && mounted.current) {
          live.current = match; base.current = { files: current.current, revision: match.revision };
          // A reconnect keeps a differing browser draft as an explicit conflict.
          const names = [...new Set([...Object.keys(current.current), ...Object.keys(match.files)])].filter(name => current.current[name] !== match.files[name]);
          base.current = match; conflictRef.current = names; setConflicts(names); setWorkspace(match);
        }
      }
    }).catch(e => { if (mounted.current) setError(e.message); });
    return () => { mounted.current = false; };
  }, [challengeId]);
  useEffect(() => {
    if (!workspace) return;
    const timeout = setTimeout(() => operations.current.synchronize().catch(e => setError(e.message)), 600);
    return () => clearTimeout(timeout);
  }, [files, workspace]);
  useEffect(() => {
    if (!workspace) return;
    const interval = setInterval(() => operations.current.synchronize(true).catch(e => setError(e.message)), 2500);
    return () => clearInterval(interval);
  }, [workspace]);
  async function start() {
    setBusy(true); setError('');
    try {
      const session = await api<Workspace>('/api/workspaces', { method: 'POST', body: JSON.stringify({ challengeId, files: current.current }) });
      base.current = session; live.current = session; setWorkspace(session); setSaveStatus('Saved to workspace');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function stop() {
    if (!workspace) return;
    setBusy(true);
    try {
      await serialized(async () => {
        await api(`/api/workspaces/${workspace.id}`, { method: 'DELETE' });
        live.current = null; base.current = null; conflictRef.current = []; setConflicts([]); setWorkspace(null); setPreview(''); setError(''); setSaveStatus('Draft saved in this browser');
      });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function openPreview(restart = false) {
    if (!workspace) return;
    setBusy(true); setPreviewStatus('Starting'); setTab('preview');
    try {
      await synchronize(true);
      const result = await api<{ url: string }>(`/api/workspaces/${workspace.id}/preview`, { method: 'POST', body: JSON.stringify({ restart }) });
      setPreview(result.url); setPreviewStatus('Loading');
    } catch (e) { setError((e as Error).message); setPreviewStatus('Unavailable'); } finally { setBusy(false); }
  }
  function resolve(name: string, useRemote: boolean) {
    if (useRemote) { const next = { ...current.current }; const value = base.current?.files[name]; if (value === undefined) delete next[name]; else next[name] = value; current.current = next; setFiles(next); }
    conflictRef.current = conflictRef.current.filter(path => path !== name); setConflicts([...conflictRef.current]); setError('');
    if (!conflictRef.current.length) void synchronize().catch(e => setError(e.message));
  }
  return <section className="ws-panel" aria-label="Code execution">
    <div className="ws-toolbar">
      <strong>Workspace</strong>
      {identity?.user ? <><span>@{identity.user.login}</span><button disabled={busy} onClick={async () => { try { if (workspace) await stop(); await api('/api/auth/logout', { method: 'POST' }); setIdentity({ ...identity, user: null }); } catch (e) { setError((e as Error).message); } }}>Sign out</button></> : <a href={`${API_BASE}/api/auth/github?returnTo=${encodeURIComponent(`/challenge/${challengeId}`)}`}>Sign in with GitHub</a>}
      {workspace ? <button disabled={busy} onClick={stop}>Stop workspace</button> : <button disabled={busy || !identity?.user || !identity.executionEnabled} onClick={start}>{busy ? 'Starting…' : 'Start workspace'}</button>}
      <span className="ws-save" role="status">{saveStatus}</span>
    </div>
    {error && <div className="ws-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {conflicts.map(name => <div className="ws-conflict" key={name}><span>Conflicting edits: {name}</span><button onClick={() => resolve(name, false)}>Keep editor</button><button onClick={() => resolve(name, true)}>Use terminal version</button></div>)}
    {!workspace && <p className="ws-empty">{identity && !identity.executionEnabled ? 'Code execution is not enabled on this server yet.' : 'Start a workspace to run Python, use the shell, and preview web challenges.'}</p>}
    {workspace && <><div className="ws-tabs"><button aria-pressed={tab === 'terminal'} onClick={() => setTab('terminal')}>Terminal</button><button disabled={!workspace.previewAvailable || busy} aria-pressed={tab === 'preview'} onClick={() => preview ? setTab('preview') : openPreview()}>Preview</button><span>Expires {new Date(workspace.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{tab === 'preview' && <><span role="status">{previewStatus}</span><button disabled={busy} onClick={() => openPreview()}>Refresh</button><button disabled={busy} onClick={() => openPreview(true)}>Restart server</button></>}</div>
      <div hidden={tab !== 'terminal'}><Suspense fallback={<p className="ws-empty">Loading terminal…</p>}><Terminal id={workspace.id} flush={() => synchronize()} onError={setError} /></Suspense></div>
      {tab === 'preview' && preview && <iframe title="Challenge web preview" src={preview} sandbox="allow-scripts allow-forms allow-same-origin" referrerPolicy="no-referrer" onLoad={() => setPreviewStatus('Loaded')} onError={() => setPreviewStatus('Unavailable')} />}
    </>}
  </section>;
});
export default WorkspacePanel;
