import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, type Meta } from "./types";
import { getSolvedIds } from "./progress";
import { useIdentity } from './IdentityContext';
import { analyticsConsent, setAnalyticsConsent } from './analytics';
import Navbar from "./Navbar";
import "./ChallengesPage.css";

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;

export default function ChallengesPage() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const { identity, progress, progressState, refresh, signOut } = useIdentity();
  const [importState, setImportState] = useState<'idle'|'saving'|'error'>('idle');
  const [importDecision, setImportDecision] = useState(0);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(analyticsConsent());

  useEffect(() => {
    fetch(`${API_BASE}/api/challenges`)
      .then((r) => {
        if (!r.ok) throw new Error("failed to load challenges");
        return r.json();
      })
      .then((data: Meta[]) => setChallenges(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    setSolvedIds(getSolvedIds());
    refresh();
  }, []);
  const accountIds = progress.map((p) => p.challenge_id);
  const eligible = solvedIds.filter((id) => !accountIds.includes(id));
  const importKey = identity?.user ? `heisenbug:import:${identity.user.id}` : '';
  const importHandled = importKey ? localStorage.getItem(importKey) === '1' : true;
  async function importProgress() {
    setImportState('saving');
    try { const response = await fetch(`${API_BASE}/api/progress/import`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ challengeIds: eligible }) }); if (!response.ok) throw new Error(); localStorage.setItem(importKey, '1'); await refresh(); setImportState('idle'); } catch { setImportState('error'); }
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of challenges) for (const cat of c.bugCategories) set.add(cat);
    return Array.from(set).sort();
  }, [challenges]);

  const filtered = challenges.filter((c) => {
    if (difficulty !== "all" && c.difficulty !== difficulty) return false;
    if (category !== "all" && !c.bugCategories.includes(category)) return false;
    if (search.trim() && !c.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="ch-page">
      <div className="ch-bg-grid" aria-hidden="true" />
      <div className="ch-glow" aria-hidden="true" />

      <Navbar />

      <header className="ch-header">
        <h1 className="ch-heading">Challenges</h1>
        <p className="ch-subheading">
          Pick a challenge below and start debugging, or{" "}
          <Link to="/mock" className="ch-mock-link">take a timed mock assessment &rarr;</Link>
        </p>
        <div className="ch-account">
          {identity?.user ? <><span>Signed in as @{identity.user.login}</span><button onClick={() => void signOut()}>Sign out</button>{identity.isAdmin && <Link to="/admin/analytics">Analytics</Link>}</> : <a href={`${API_BASE}/api/auth/github?returnTo=/challenges`}>Sign in with GitHub</a>}
        </div>
        <div className="ch-analytics-choice" aria-label="Analytics preference">
          <span>Help improve Heisenbug with anonymous browser activity?</span>
          <button aria-pressed={analyticsAllowed} onClick={() => { setAnalyticsConsent(true); setAnalyticsAllowed(true); }}>Allow analytics</button>
          <button aria-pressed={!analyticsAllowed} onClick={() => { setAnalyticsConsent(false); setAnalyticsAllowed(false); }}>Decline</button>
        </div>
      </header>

      {identity?.user && eligible.length > 0 && !importHandled && <section className="ch-import" aria-label="Import browser progress" data-decision={importDecision}><strong>Import browser progress</strong><p>Import {eligible.length} browser solve{eligible.length === 1 ? '' : 's'} to @{identity.user.login}. Your browser marks will stay here and imported solves remain labeled until verified.</p><button disabled={importState === 'saving'} onClick={() => void importProgress()}>{importState === 'saving' ? 'Importing…' : 'Import browser progress'}</button><button onClick={() => { localStorage.setItem(importKey, '1'); setImportDecision(value => value + 1); }}>Not now</button>{importState === 'error' && <p role="alert">Import failed. Please try again.</p>}</section>}
      {identity?.user && progressState === 'unavailable' && <div className="ch-state-message" role="alert">Account progress is unavailable. <button onClick={() => void refresh()}>Retry</button></div>}
      <div className="ch-search-row">
        <input
          type="text"
          className="ch-search-input"
          placeholder="Search challenges by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search challenges by title"
        />
      </div>

      <div className="ch-toolbar">
        <div className="ch-filter-group">
          <span className="ch-filter-label">Difficulty</span>
          <div className="ch-pill-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`ch-pill ch-pill-${d} ${difficulty === d ? "active" : ""}`}
                onClick={() => setDifficulty(d)}
              >
                {d === "all" ? "All" : d}
              </button>
            ))}
          </div>
        </div>

        <div className="ch-filter-group">
          <span className="ch-filter-label">Category</span>
          <div className="ch-pill-row">
            <button
              className={`ch-pill ${category === "all" ? "active" : ""}`}
              onClick={() => setCategory("all")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`ch-pill ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ch-result-count">
        {!loading &&
          `${filtered.length} challenge${filtered.length === 1 ? "" : "s"}` +
            (new Set([...solvedIds, ...accountIds]).size > 0
              ? ` — ${new Set([...solvedIds, ...accountIds]).size}/${challenges.length} solved`
              : "")}
      </div>

      {loading && (
        <div className="ch-state-message ch-loading">
          <span className="ch-spinner" />
          Loading challenges...
        </div>
      )}

      {!loading && loadError && (
        <div className="ch-state-message ch-empty">
          Couldn't load challenges. Is the backend running?
        </div>
      )}

      {!loading && !loadError && filtered.length === 0 && (
        <div className="ch-state-message ch-empty">
          No challenges match these filters.
          <button
            className="ch-clear-filters-btn"
            onClick={() => {
              setDifficulty("all");
              setCategory("all");
              setSearch("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && !loadError && filtered.length > 0 && (
        <div className="ch-table-wrap">
          <table className="ch-table">
            <thead>
              <tr>
                <th className="ch-col-status" aria-label="Solved" />
                <th className="ch-col-num">#</th>
                <th className="ch-col-title">Title</th>
                <th className="ch-col-tags">Tags</th>
                <th className="ch-col-diff">Difficulty</th>
                <th className="ch-col-time">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const num = c.id.match(/^\d+/)?.[0] ?? "";
                const entry = progress.find((p) => p.challenge_id === c.id);
                const solved = solvedIds.includes(c.id) || !!entry;
                return (
                  <tr
                    key={c.id}
                    className="ch-row"
                    onClick={() => navigate(`/challenge/${c.id}`)}
                  >
                    <td className="ch-col-status">
                      {solved && (
                        <span className="ch-solved-check" title={entry?.verified ? "Verified solve" : entry?.imported ? "Imported browser solve" : "Solved"}>
                          &#10003;
                        </span>
                      )}
                    </td>
                    <td className="ch-col-num">{num}</td>
                    <td className="ch-col-title">
                      <Link
                        to={`/challenge/${c.id}`}
                        className="ch-row-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="ch-col-tags">
                      <div className="ch-card-tags">
                        {c.bugCategories.map((cat) => (
                          <span key={cat} className="ch-tag">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="ch-col-diff">
                      <span className={`ch-diff-text ch-diff-text-${c.difficulty}`}>
                        {c.difficulty}
                      </span>
                    </td>
                    <td className="ch-col-time">{c.timeLimitMinutes} min</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
