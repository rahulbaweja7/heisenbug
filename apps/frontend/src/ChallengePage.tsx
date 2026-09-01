import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { API_BASE, type Challenge, type SubmitResult } from "./types";
import Markdown from "./Markdown";
import { markSolved } from "./progress";
import "./ChallengePage.css";

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [explanation, setExplanation] = useState<string | null>(null);

  useEffect(() => {
    setChallenge(null);
    setResult(null);
    setExplanation(null);
    fetch(`${API_BASE}/api/challenges/${id}`)
      .then((r) => r.json())
      .then((c: Challenge) => {
        setChallenge(c);
        setFileContents(c.files);
        setActiveFile(Object.keys(c.files)[0]);
        setSecondsLeft(c.meta.timeLimitMinutes * 60);
      });
  }, [id]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft > 0]);

  useEffect(() => {
    if (!result?.passed || !challenge) return;
    markSolved(challenge.meta.id);
    fetch(`${API_BASE}/api/challenges/${challenge.meta.id}/explanation`)
      .then((r) => r.json())
      .then((data: { markdown: string }) => setExplanation(data.markdown));
  }, [result?.passed, challenge]);

  async function handleSubmit() {
    if (!challenge) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/challenges/${challenge.meta.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: fileContents }),
        }
      );
      setResult(await res.json());
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    if (!challenge) return;
    if (!confirm("Reset all files back to the starter code? This can't be undone.")) {
      return;
    }
    setFileContents(challenge.files);
    setResult(null);
    setExplanation(null);
  }

  if (!challenge || !activeFile) {
    return <div className="cp-loading">Loading challenge...</div>;
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowOnTime = secondsLeft > 0 && secondsLeft <= 60;
  const timeUp = secondsLeft === 0;

  return (
    <div className="cp-app">
      <header className="cp-topbar">
        <Link to="/" className="cp-brand">
          Heisenbug
        </Link>
        <div className={`cp-timer ${lowOnTime ? "cp-timer-low" : ""}`}>
          {mm}:{ss}
        </div>
      </header>

      {timeUp && !result?.passed && (
        <div className="cp-timeup-banner">
          Time's up — this is untimed practice mode now, keep going and run
          the tests whenever you're ready.
        </div>
      )}

      <div className="cp-body">
        <aside className="cp-description">
          <h1 className="cp-title">{challenge.meta.title}</h1>
          <div className="cp-meta-row">
            <span className={`cp-badge cp-badge-${challenge.meta.difficulty}`}>
              {challenge.meta.difficulty}
            </span>
            <span className="cp-meta-item">{challenge.meta.language}</span>
            <span className="cp-meta-dot" />
            <span className="cp-meta-item">{challenge.meta.timeLimitMinutes} min</span>
          </div>
          <div className="cp-tags">
            {challenge.meta.bugCategories.map((cat) => (
              <span key={cat} className="cp-tag">
                {cat}
              </span>
            ))}
          </div>
          <div className="cp-description-body">
            <Markdown text={challenge.meta.description} />
          </div>

          {explanation && (
            <div className="cp-explanation">
              <div className="cp-explanation-heading">Solved! Here's why:</div>
              <div className="cp-explanation-body">
                <Markdown text={explanation} />
              </div>
            </div>
          )}
        </aside>

        <main className="cp-workspace">
          <div className="cp-file-tabs">
            {Object.keys(challenge.files).map((path) => (
              <button
                key={path}
                className={path === activeFile ? "cp-tab active" : "cp-tab"}
                onClick={() => setActiveFile(path)}
              >
                {path}
              </button>
            ))}
            <div className="cp-file-tabs-spacer" />
            <button className="cp-reset-btn" onClick={handleReset}>
              Reset
            </button>
            <button className="cp-run-btn" onClick={handleSubmit} disabled={running}>
              {running ? "Running..." : "Run tests"}
            </button>
          </div>

          <div className="cp-editor-pane">
            <Editor
              height="100%"
              language={challenge.meta.language}
              path={activeFile}
              value={fileContents[activeFile]}
              onChange={(value) =>
                setFileContents((prev) => ({ ...prev, [activeFile]: value ?? "" }))
              }
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          </div>

          <div className="cp-console">
            {!result && (
              <div className="cp-console-placeholder">
                Run the tests to see results here.
              </div>
            )}
            {result && (
              <div className={`cp-result ${result.passed ? "pass" : "fail"}`}>
                <div className="cp-result-heading">
                  {result.passed ? "All tests passed" : "Tests failed"}
                </div>
                <pre>
                  {result.stdout}
                  {result.stderr}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
