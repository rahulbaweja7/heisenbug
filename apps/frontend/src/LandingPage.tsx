import { Link } from "react-router-dom";
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

export default function LandingPage() {
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

      <section className="lp-how-it-works">
        {STEPS.map((s) => (
          <div className="lp-step" key={s.title}>
            <span className="lp-step-icon">{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
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
