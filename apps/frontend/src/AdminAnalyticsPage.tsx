import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './workspace/api';
import { useIdentity } from './IdentityContext';
import './admin.css';

type Row = {
  challenge_id: string; views: number; practice_starts: number;
  successful_workspace_starts: number; completed_submissions: number;
  passing_submissions: number; unique_verified_solvers: number;
  infrastructure_errors: number; pass_rate: number | null;
  tracked_session_conversion: number | null;
};
type Daily = { date: string; views: number; practice_starts: number; successful_workspace_starts: number; completed_submissions: number; passing_submissions: number; infrastructure_errors: number };
type Report = { daily: Daily[]; challenges: Row[]; grading_totals: Record<string, number>; consented_funnel: Record<string, number> };
const date = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const columns: Array<[keyof Row, string]> = [['challenge_id','Challenge'],['views','Views'],['practice_starts','Practice starts'],['successful_workspace_starts','Workspace starts'],['completed_submissions','Completed submissions'],['passing_submissions','Passing submissions'],['unique_verified_solvers','Verified solvers'],['infrastructure_errors','Infrastructure errors'],['pass_rate','Pass rate'],['tracked_session_conversion','Tracked conversion']];
const percent = (value: number | null) => value === null ? '—' : `${(value * 100).toFixed(1)}%`;

export default function AdminAnalyticsPage() {
  const { identity, progressState } = useIdentity();
  const [from,setFrom] = useState(date(-29)); const [to,setTo] = useState(date());
  const [state,setState] = useState<'loading'|'ready'|'error'>('loading');
  const [report,setReport] = useState<Report|null>(null); const [sort,setSort] = useState<keyof Row>('views');
  const load = () => { setState('loading'); api<Report>(`/api/admin/analytics?from=${from}&to=${to}`).then(value => { setReport(value); setState('ready'); }).catch(() => setState('error')); };
  useEffect(() => { if (identity?.isAdmin) load(); }, [identity?.user?.id, identity?.isAdmin, from, to]);
  const rows = useMemo(() => [...(report?.challenges || [])].sort((a,b) => sort === 'challenge_id' ? a.challenge_id.localeCompare(b.challenge_id) : Number(b[sort] ?? -1) - Number(a[sort] ?? -1)), [report,sort]);
  if (progressState === 'loading' && !identity) return <main className="admin-page">Loading account…</main>;
  if (!identity?.user) return <main className="admin-page">Sign in with GitHub to continue. <Link to="/challenges">Back</Link></main>;
  if (!identity.isAdmin) return <main className="admin-page">Forbidden. <Link to="/challenges">Back</Link></main>;
  return <main className="admin-page"><Link to="/challenges">← Challenges</Link><h1>Analytics</h1><p>Browser metrics represent consented activity. Grading totals cover all accounts. Dates are inclusive UTC.</p>
    <div className="admin-controls"><label>From <input type="date" value={from} max={to} onChange={event=>setFrom(event.target.value)}/></label><label>To <input type="date" value={to} min={from} onChange={event=>setTo(event.target.value)}/></label></div>
    {state==='loading'&&<p>Loading analytics…</p>}{state==='error'&&<p role="alert">Couldn’t load analytics. <button onClick={load}>Retry</button></p>}
    {state==='ready'&&report&&<><section className="admin-summary"><h2>All-account grading</h2>{Object.entries(report.grading_totals).map(([key,value])=><span key={key}><strong>{value}</strong> {key.replaceAll('_',' ')}</span>)}<h2>Consented visitor funnel</h2>{Object.entries(report.consented_funnel).map(([key,value])=><span key={key}><strong>{value}</strong> {key.replaceAll('_',' ')}</span>)}</section>
      <section><h2>Daily trends</h2><div className="admin-table-wrap"><table><thead><tr><th>Date</th><th>Views</th><th>Practice starts</th><th>Workspace starts</th><th>Completed</th><th>Passing</th><th>Infrastructure errors</th></tr></thead><tbody>{report.daily.map(row=><tr key={row.date}><td>{row.date}</td><td>{row.views}</td><td>{row.practice_starts}</td><td>{row.successful_workspace_starts}</td><td>{row.completed_submissions}</td><td>{row.passing_submissions}</td><td>{row.infrastructure_errors}</td></tr>)}</tbody></table></div></section>
      <section><h2>Challenges</h2>{!rows.length?<p>No activity in this period.</p>:<div className="admin-table-wrap"><table><thead><tr>{columns.map(([key,label])=><th key={key}><button onClick={()=>setSort(key)} aria-pressed={sort===key}>{label}</button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.challenge_id}>{columns.map(([key])=><td key={key}>{key==='pass_rate'||key==='tracked_session_conversion'?percent(row[key] as number|null):row[key]}</td>)}</tr>)}</tbody></table></div>}</section></>}
  </main>;
}
