import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, type Meta } from "./types";
import "./ChallengeList.css";

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M4 6a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
          strokeLinejoin="round"
        />
        <path d="M9 13h6M9 17h4" strokeLinecap="round" />
      </svg>
    ),
    title: "Pick a challenge",
    body: "Choose a language, difficulty, and bug category.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
    ),
    title: "Find the bug",
    body: "Get dropped into a broken multi-file project with a countdown timer, just like the real assessment.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 13 9 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Learn the pattern",
    body: "Pass the hidden test suite, then read why the bug happens and how to spot it faster next time.",
  },
];

type Token = { text: string; cls?: string };

const MOCK_CODE_LINES: Token[][] = [
  [
    { text: "def ", cls: "tok-kw" },
    { text: "count_low_stock", cls: "tok-fn" },
    { text: "(items, threshold):" },
  ],
  [{ text: "    count = 0" }],
  [
    { text: "    for ", cls: "tok-kw" },
    { text: "i in " },
    { text: "range(len(items)" },
    { text: " - 1", cls: "mock-strike" },
    { text: "):" },
  ],
  [
    { text: "        if ", cls: "tok-kw" },
    { text: "items[i][" },
    { text: '"quantity"', cls: "tok-str" },
    { text: "] <= threshold:" },
  ],
  [{ text: "            count += 1" }],
  [
    { text: "    return ", cls: "tok-kw" },
    { text: "count" },
  ],
];

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
      <div className="bg-grid" aria-hidden="true" />
      <div className="glow" aria-hidden="true" />

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Practice platform</span>
          <h1 className="hero-title">
            Heisen<span className="hero-title-accent">bug</span>
          </h1>
          <p className="tagline">
            Practice the new Amazon-style debugging OA format — get dropped
            into a broken codebase, find the bug, make the tests green.
          </p>
          <div className="hero-actions">
            <a href="#challenges" className="cta-btn">
              Start practicing &rarr;
            </a>
            <a
              href="https://github.com/rahulbaweja7/heisenbug"
              target="_blank"
              rel="noreferrer"
              className="cta-btn-ghost"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="mock-window">
            <div className="mock-titlebar">
              <span className="mock-dot mock-dot-red" />
              <span className="mock-dot mock-dot-yellow" />
              <span className="mock-dot mock-dot-green" />
              <span className="mock-filename">inventory.py</span>
            </div>
            <pre className="mock-code">
              <code>
                {MOCK_CODE_LINES.map((line, i) => (
                  <div className="mock-line" key={i}>
                    {line.map((tok, j) => (
                      <span key={j} className={tok.cls}>
                        {tok.text}
                      </span>
                    ))}
                  </div>
                ))}
              </code>
            </pre>
            <div className="mock-result mock-result-fail">
              <span>&times;</span> 1 test failed
            </div>
            <div className="mock-result mock-result-pass">
              <span>&#10003;</span> 3 tests passed
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        {STEPS.map((s) => (
          <div className="step" key={s.title}>
            <span className="step-icon">{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </section>

      <div className="toolbar" id="challenges">
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

      <footer className="page-footer">
        <span>Heisenbug</span>
        <a href="https://github.com/rahulbaweja7/heisenbug" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
