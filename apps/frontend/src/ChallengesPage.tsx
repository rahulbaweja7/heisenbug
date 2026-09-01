import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, type Meta } from "./types";
import { getSolvedIds } from "./progress";
import "./ChallengesPage.css";

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);

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
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of challenges) for (const cat of c.bugCategories) set.add(cat);
    return Array.from(set).sort();
  }, [challenges]);

  const filtered = challenges.filter((c) => {
    if (difficulty !== "all" && c.difficulty !== difficulty) return false;
    if (category !== "all" && !c.bugCategories.includes(category)) return false;
    return true;
  });

  return (
    <div className="ch-page">
      <div className="ch-bg-grid" aria-hidden="true" />
      <div className="ch-glow" aria-hidden="true" />

      <header className="ch-header">
        <Link to="/" className="ch-brand">
          Heisenbug
        </Link>
        <h1 className="ch-heading">Challenges</h1>
        <p className="ch-subheading">
          Pick a challenge below and start debugging.
        </p>
      </header>

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
            (solvedIds.length > 0
              ? ` — ${solvedIds.length}/${challenges.length} solved`
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
        </div>
      )}

      <ul className="ch-grid">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              to={`/challenge/${c.id}`}
              className={`ch-card ch-difficulty-${c.difficulty}`}
            >
              <div className="ch-card-top">
                <span className="ch-card-title">
                  {solvedIds.includes(c.id) && (
                    <span className="ch-solved-check" title="Solved">
                      &#10003;
                    </span>
                  )}
                  {c.title}
                </span>
                <span className={`ch-diff-badge ch-diff-badge-${c.difficulty}`}>
                  {c.difficulty}
                </span>
              </div>
              <div className="ch-card-meta">
                <span className="ch-meta-item">{c.language}</span>
                <span className="ch-meta-dot" />
                <span className="ch-meta-item">{c.timeLimitMinutes} min</span>
              </div>
              <div className="ch-card-tags">
                {c.bugCategories.map((cat) => (
                  <span key={cat} className="ch-tag">
                    {cat}
                  </span>
                ))}
              </div>
              <span className="ch-card-arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
