import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, type Challenge, type Meta, type SubmitResult } from "./types";
import { markSolved } from "./progress";
import ChallengeWorkspace from "./ChallengeWorkspace";
import "./MockAssessmentPage.css";

const SESSION_KEY = "heisenbug:mock:session";
const SESSION_MINUTES = 90;
const TIERS: Array<Meta["difficulty"]> = ["easy", "medium", "hard"];

type StoredSession = {
  id: string;
  challengeIds: string[];
  deadline: number;
  results: Record<string, SubmitResult>;
};

function loadStoredSession(): StoredSession | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (raw && typeof raw === "object" && Array.isArray(raw.challengeIds) && typeof raw.deadline === "number") return raw;
  } catch { /* Browser storage can be unavailable. */ }
  return null;
}

function saveSession(session: StoredSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* Progress stays in memory only. */ }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* Nothing to clean up. */ }
}

function pickPreset(pool: Meta[]): Meta[] {
  const eligible = pool.filter((m) => !m.workspace);
  const picks: Meta[] = [];
  for (const tier of TIERS) {
    const candidates = eligible.filter((m) => m.difficulty === tier && !picks.includes(m));
    if (candidates.length > 0) picks.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  const remaining = eligible.filter((m) => !picks.includes(m));
  while (picks.length < 3 && remaining.length > 0) {
    picks.push(remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]);
  }
  return picks;
}

export default function MockAssessmentPage() {
  const [phase, setPhase] = useState<"loading" | "intro" | "active" | "results">("loading");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [results, setResults] = useState<Record<string, SubmitResult>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [deadline, setDeadline] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadStoredSession();
    if (!stored || stored.deadline <= Date.now()) {
      setPhase("intro");
      return;
    }
    Promise.all(stored.challengeIds.map((id) => fetch(`${API_BASE}/api/challenges/${id}`).then((r) => r.json())))
      .then((loaded: Challenge[]) => {
        setChallenges(loaded);
        setResults(stored.results);
        setSessionId(stored.id);
        setDeadline(stored.deadline);
        setPhase("active");
      })
      .catch(() => { clearSession(); setPhase("intro"); });
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setPhase("results");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, deadline]);

  async function startSession() {
    setError("");
    setPhase("loading");
    try {
      const pool: Meta[] = await fetch(`${API_BASE}/api/challenges`).then((r) => r.json());
      const preset = pickPreset(pool);
      if (preset.length === 0) throw new Error("No challenges available");
      const loaded: Challenge[] = await Promise.all(preset.map((m) => fetch(`${API_BASE}/api/challenges/${m.id}`).then((r) => r.json())));
      const id = crypto.randomUUID();
      const sessionDeadline = Date.now() + SESSION_MINUTES * 60000;
      saveSession({ id, challengeIds: loaded.map((c) => c.meta.id), deadline: sessionDeadline, results: {} });
      setChallenges(loaded);
      setResults({});
      setActiveIndex(0);
      setSessionId(id);
      setDeadline(sessionDeadline);
      setPhase("active");
    } catch {
      setError("Couldn't start the assessment. Is the backend running?");
      setPhase("intro");
    }
  }

  function recordResult(challengeId: string, result: SubmitResult) {
    setResults((prev) => {
      const next = { ...prev, [challengeId]: result };
      const stored = loadStoredSession();
      if (stored) saveSession({ ...stored, results: next });
      return next;
    });
    if (result.passed) markSolved(challengeId);
  }

  function finishNow() {
    clearSession();
    setPhase("results");
  }

  function startOver() {
    clearSession();
    setChallenges([]);
    setResults({});
    setActiveIndex(0);
    setPhase("intro");
  }

  if (phase === "loading") {
    return <div className="cp-loading">Loading mock assessment...</div>;
  }

  if (phase === "intro") {
    return (
      <div className="ma-intro">
        <Link to="/" className="cp-brand">Heisenbug</Link>
        <h1>Mock Assessment</h1>
        <p>
          Three challenges — one easy, one medium, one hard — picked at random.
          {" "}{SESSION_MINUTES} minutes on the clock, one score at the end.
          The closest thing here to sitting down and doing the real OA.
        </p>
        {error && <p className="ma-error" role="alert">{error}</p>}
        <button className="ma-start-btn" onClick={startSession}>Start mock assessment</button>
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowOnTime = secondsLeft > 0 && secondsLeft <= 300;

  if (phase === "results") {
    const solvedCount = challenges.filter((c) => results[c.meta.id]?.passed).length;
    return (
      <div className="ma-results">
        <Link to="/" className="cp-brand">Heisenbug</Link>
        <h1>Assessment complete</h1>
        <p className="ma-score">{solvedCount}/{challenges.length} solved</p>
        <table className="ma-results-table">
          <thead>
            <tr><th>Challenge</th><th>Difficulty</th><th>Result</th></tr>
          </thead>
          <tbody>
            {challenges.map((c) => {
              const result = results[c.meta.id];
              const status = !result ? "Not attempted" : result.passed ? "Passed" : "Failed";
              return (
                <tr key={c.meta.id}>
                  <td>{c.meta.title}</td>
                  <td className={`ma-diff ma-diff-${c.meta.difficulty}`}>{c.meta.difficulty}</td>
                  <td className={`ma-status ma-status-${status.toLowerCase().replace(" ", "-")}`}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="ma-results-actions">
          <button className="ma-start-btn" onClick={startOver}>Start a new mock assessment</button>
          <Link to="/challenges" className="ma-secondary-link">Back to challenges</Link>
        </div>
      </div>
    );
  }

  const active = challenges[activeIndex];

  return (
    <div className="cp-app">
      <header className="cp-topbar">
        <Link to="/" className="cp-brand">Heisenbug</Link>
        <div className={`cp-timer ${lowOnTime ? "cp-timer-low" : ""}`}>{mm}:{ss}</div>
      </header>

      <div className="ma-tab-strip">
        {challenges.map((c, index) => {
          const result = results[c.meta.id];
          return (
            <button
              key={c.meta.id}
              className={index === activeIndex ? "ma-challenge-tab active" : "ma-challenge-tab"}
              onClick={() => setActiveIndex(index)}
            >
              {result && <span className={result.passed ? "ma-tab-check pass" : "ma-tab-check fail"}>{result.passed ? "✓" : "✗"}</span>}
              {c.meta.title}
            </button>
          );
        })}
        <div className="cp-file-tabs-spacer" />
        <button className="cp-reset-btn" onClick={finishNow}>Finish assessment</button>
      </div>

      {active && (
        <div className="cp-body ma-body">
          <ChallengeWorkspace
            key={active.meta.id}
            challenge={active}
            draftKey={`heisenbug:mock:${sessionId}:${active.meta.id}`}
            onResult={(result) => recordResult(active.meta.id, result)}
          />
        </div>
      )}
    </div>
  );
}
