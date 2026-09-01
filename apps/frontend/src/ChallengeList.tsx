import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, type Meta } from "./types";
import "./ChallengeList.css";

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;

export default function ChallengeList() {
  const [challenges, setChallenges] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    fetch(`${API_BASE}/api/challenges`)
      .then((r) => r.json())
      .then((data: Meta[]) => setChallenges(data))
      .finally(() => setLoading(false));
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
    <div className="list-page">
      <div className="glow" aria-hidden="true" />

      <header className="hero">
        <span className="eyebrow">Practice platform</span>
        <h1 className="hero-title">
          Heisen<span className="hero-title-accent">bug</span>
        </h1>
        <p className="tagline">
          Practice the new Amazon-style debugging OA format — get dropped
          into a broken codebase, find the bug, make the tests green.
        </p>
      </header>

      <div className="toolbar">
        <div className="filter-group">
          <span className="filter-label">Difficulty</span>
          <div className="pill-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`pill pill-${d} ${difficulty === d ? "active" : ""}`}
                onClick={() => setDifficulty(d)}
              >
                {d === "all" ? "All" : d}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Category</span>
          <div className="pill-row">
            <button
              className={`pill ${category === "all" ? "active" : ""}`}
              onClick={() => setCategory("all")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`pill ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="result-count">
        {!loading &&
          `${filtered.length} challenge${filtered.length === 1 ? "" : "s"}`}
      </div>

      {loading && (
        <div className="state-message loading">
          <span className="spinner" />
          Loading challenges...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="state-message empty">No challenges match these filters.</div>
      )}

      <ul className="challenge-grid">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              to={`/challenge/${c.id}`}
              className={`challenge-card difficulty-${c.difficulty}`}
            >
              <div className="card-top">
                <span className="card-title">{c.title}</span>
                <span className={`diff-badge diff-badge-${c.difficulty}`}>{c.difficulty}</span>
              </div>
              <div className="card-meta">
                <span className="meta-item">{c.language}</span>
                <span className="meta-dot" />
                <span className="meta-item">{c.timeLimitMinutes} min</span>
              </div>
              <div className="card-tags">
                {c.bugCategories.map((cat) => (
                  <span key={cat} className="tag">
                    {cat}
                  </span>
                ))}
              </div>
              <span className="card-arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
