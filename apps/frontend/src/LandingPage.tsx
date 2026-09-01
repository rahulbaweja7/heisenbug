import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, type Meta } from "./types";
import "./LandingPage.css";

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

const VALUE_PROPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h8M8 13h5" strokeLinecap="round" />
      </svg>
    ),
    title: "The actual OA format",
    body: "Not another algorithm grind. A broken multi-file project and a countdown timer — the same format companies like Amazon are shifting to.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
      </svg>
    ),
    title: "Real test execution, not a mock",
    body: "\"Run tests\" actually runs pytest against your code server-side and streams back the real output — pass or fail, no simulated results.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5V6a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13" strokeLinejoin="round" />
      </svg>
    ),
    title: "Every challenge teaches the pattern",
    body: "Solve it, then read exactly what the bug was, why it happens, and how to spot that shape of bug faster next time — not just a diff.",
  },
];

const FAQS = [
  {
    q: "Is this affiliated with Amazon?",
    a: "No. Heisenbug is an independent practice tool built to mimic the format of repo-based debugging assessments — it isn't made or endorsed by any company that uses them.",
  },
  {
    q: "What languages are supported?",
    a: "Python for now. More languages are planned as the challenge library grows.",
  },
  {
    q: "Is my code actually run, or just checked against a pattern?",
    a: "Actually run — your submission executes against a real hidden pytest suite server-side, and you get the real pass/fail output back.",
  },
  {
    q: "Is it free?",
    a: "Yes, right now the whole thing is free to use while it's early.",
  },
];

export default function LandingPage() {
  const [challengeCount, setChallengeCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/challenges`)
      .then((r) => r.json())
      .then((data: Meta[]) => {
        setChallengeCount(data.length);
        const cats = new Set<string>();
        for (const c of data) for (const cat of c.bugCategories) cats.add(cat);
        setCategoryCount(cats.size);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="lp-page">
      <div className="lp-bg-grid" aria-hidden="true" />
      <div className="lp-glow" aria-hidden="true" />

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span className="lp-eyebrow">Practice platform</span>
          <h1 className="lp-title">
            Heisen<span className="lp-title-accent">bug</span>
          </h1>
          <p className="lp-tagline">
            Practice the new Amazon-style debugging OA format — get dropped
            into a broken codebase, find the bug, make the tests green.
          </p>
          <div className="lp-actions">
            <Link to="/challenges" className="lp-cta-btn">
              Start practicing &rarr;
            </Link>
            <a
              href="https://github.com/rahulbaweja7/heisenbug"
              target="_blank"
              rel="noreferrer"
              className="lp-cta-btn-ghost"
            >
              View on GitHub
            </a>
          </div>

          {challengeCount !== null && (
            <div className="lp-stats">
              <span>
                <strong>{challengeCount}</strong> challenges
              </span>
              <span className="lp-stats-dot" />
              <span>
                <strong>{categoryCount}</strong> bug categories
              </span>
              <span className="lp-stats-dot" />
              <span>Python, free</span>
            </div>
          )}
        </div>

        <div className="lp-hero-visual" aria-hidden="true">
          <div className="lp-mock-window">
            <div className="lp-mock-titlebar">
              <span className="lp-mock-dot lp-mock-dot-red" />
              <span className="lp-mock-dot lp-mock-dot-yellow" />
              <span className="lp-mock-dot lp-mock-dot-green" />
              <span className="lp-mock-filename">inventory.py</span>
            </div>
            <pre className="lp-mock-code">
              <code>
                {MOCK_CODE_LINES.map((line, i) => (
                  <div className="lp-mock-line" key={i}>
                    {line.map((tok, j) => (
                      <span key={j} className={tok.cls}>
                        {tok.text}
                      </span>
                    ))}
                  </div>
                ))}
              </code>
            </pre>
            <div className="lp-mock-result lp-mock-result-fail">
              <span>&times;</span> 1 test failed
            </div>
            <div className="lp-mock-result lp-mock-result-pass">
              <span>&#10003;</span> 3 tests passed
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <h2 className="lp-section-title">Why Heisenbug</h2>
        <div className="lp-value-grid">
          {VALUE_PROPS.map((v) => (
            <div className="lp-value-card" key={v.title}>
              <span className="lp-step-icon">{v.icon}</span>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <h2 className="lp-section-title">How it works</h2>
        <div className="lp-how-it-works">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.title}>
              <span className="lp-step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <h2 className="lp-section-title">FAQ</h2>
        <div className="lp-faq">
          {FAQS.map((f) => (
            <div className="lp-faq-item" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-cta-section">
        <h2>Ready to find your first bug?</h2>
        <Link to="/challenges" className="lp-cta-btn">
          Start practicing &rarr;
        </Link>
      </section>

      <footer className="lp-footer">
        <span>Heisenbug</span>
        <a href="https://github.com/rahulbaweja7/heisenbug" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}

type Token = { text: string; cls?: string };

const MOCK_CODE_LINES: Token[][] = [
  [
    { text: "def ", cls: "lp-tok-kw" },
    { text: "count_low_stock", cls: "lp-tok-fn" },
    { text: "(items, threshold):" },
  ],
  [{ text: "    count = 0" }],
  [
    { text: "    for ", cls: "lp-tok-kw" },
    { text: "i in " },
    { text: "range(len(items)" },
    { text: " - 1", cls: "lp-mock-strike" },
    { text: "):" },
  ],
  [
    { text: "        if ", cls: "lp-tok-kw" },
    { text: "items[i][" },
    { text: '"quantity"', cls: "lp-tok-str" },
    { text: "] <= threshold:" },
  ],
  [{ text: "            count += 1" }],
  [
    { text: "    return ", cls: "lp-tok-kw" },
    { text: "count" },
  ],
];
