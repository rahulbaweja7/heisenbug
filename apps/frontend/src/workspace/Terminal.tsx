import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { API_BASE } from '../types';
export default function Terminal({ id, flush, onError }: { id: string; flush: () => Promise<unknown>; onError: (error: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ flush, onError });
  useLayoutEffect(() => { callbacks.current = { flush, onError }; });
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Connecting');
  useEffect(() => {
    if (!host.current) return;
    let disposed = false, ready = false;
    const terminal = new XTerminal({ theme: { background: '#111318', foreground: '#e4e4eb' }, fontSize: 12, fontFamily: 'Consolas, monospace', scrollback: 1500, convertEol: false });
    const fit = new FitAddon(); terminal.loadAddon(fit); terminal.open(host.current); fit.fit();
    const url = new URL(`${API_BASE}/api/workspaces/${id}/terminal`, location.href); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url);
    const resize = () => { fit.fit(); if (ready && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows })); };
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.type === 'output') terminal.write(Uint8Array.from(atob(message.data), char => char.charCodeAt(0)));
      if (message.type === 'ready') { ready = true; setStatus('Connected'); resize(); terminal.focus(); }
    };
    socket.onclose = event => { if (!disposed) setStatus(event.reason || 'Disconnected'); };
    socket.onerror = () => { if (!disposed) setStatus('Connection failed'); };
    let input = Promise.resolve();
    const subscription = terminal.onData(data => {
      if (data === '\x03' && socket.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ type: 'input', data })); return; }
      input = input.then(async () => {
        if (!ready || socket.readyState !== WebSocket.OPEN) return;
        // Interrupt must remain usable even when file synchronization fails.
        if (data !== '\x03') await callbacks.current.flush();
        socket.send(JSON.stringify({ type: 'input', data }));
      }).catch(error => callbacks.current.onError(error.message));
    });
    const observer = new ResizeObserver(resize); observer.observe(host.current);
    return () => { disposed = true; observer.disconnect(); subscription.dispose(); socket.close(); terminal.dispose(); };
  }, [id, attempt]);
  return <div className="ws-terminal"><div className="ws-terminal-status"><span>{status}</span>{status !== 'Connected' && <button onClick={() => { setStatus('Connecting'); setAttempt(n => n + 1); }}>Reconnect</button>}</div><div className="ws-terminal-host" ref={host} /></div>;
}
