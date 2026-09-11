import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, type Challenge, type SubmitResult } from "./types";
import Markdown from "./Markdown";
import { markSolved } from "./progress";
import ChallengeWorkspace from "./ChallengeWorkspace";
import { track } from './analytics';
import "./ChallengePage.css";

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [editingTimer, setEditingTimer] = useState(false);
  const [timerInput, setTimerInput] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [leftTab, setLeftTab] = useState<"description" | "solution">("description");
  const [solutionWriteup, setSolutionWriteup] = useState<string | null>(null);
  const [solutionState, setSolutionState] = useState<
    "idle" | "loading" | "loaded" | "unavailable"
  >("idle");
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    setChallenge(null);
    setExplanation(null);
    setLoadError(false);
    setLeftTab("description");
    setSolutionWriteup(null);
    setSolutionState("idle");
    setEditingTimer(false);
    setPassed(false);
    fetch(`${API_BASE}/api/challenges/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((c: Challenge) => {
        setChallenge(c);
        setSecondsLeft(c.meta.timeLimitMinutes * 60);
        track('challenge_view', c.meta.id);
      })
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (leftTab !== "solution" || !challenge || solutionState !== "idle") return;
    setSolutionState("loading");
    fetch(`${API_BASE}/api/challenges/${challenge.meta.id}/solution-writeup`)
      .then((r) => {
        if (!r.ok) throw new Error("not available");
        return r.json();
      })
      .then((data: { markdown: string }) => {
        setSolutionWriteup(data.markdown);
        setSolutionState("loaded");
      })
      .catch(() => setSolutionState("unavailable"));
  }, [leftTab, challenge, solutionState]);

  function handleWorkspaceResult(result: SubmitResult) {
    setPassed(result.passed);
    if (!result.passed || !challenge) return;
    markSolved(challenge.meta.id);
    fetch(`${API_BASE}/api/challenges/${challenge.meta.id}/explanation`)
      .then((r) => r.json())
      .then((data: { markdown: string }) => setExplanation(data.markdown));
  }

  function openTimerEdit() {
    setTimerInput(String(Math.max(1, Math.ceil(secondsLeft / 60))));
    setEditingTimer(true);
  }

  function applyTimerEdit() {
    const minutes = Number(timerInput);
    if (Number.isFinite(minutes) && minutes > 0) {
      setSecondsLeft(Math.round(Math.min(180, minutes) * 60));
    }
    setEditingTimer(false);
  }

  if (loadError) {
    return (
      <div className="cp-loading">
        <div>
          Couldn't load this challenge.{" "}
          <Link to="/challenges" className="cp-error-link">
            Back to challenges
          </Link>
        </div>
      </div>
    );
  }

  if (!challenge) {
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
        {editingTimer ? (
          <input
            type="number"
            min={1}
            max={180}
            autoFocus
            className="cp-timer-input"
            value={timerInput}
            onChange={(e) => setTimerInput(e.target.value)}
            onBlur={applyTimerEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyTimerEdit();
              if (e.key === "Escape") setEditingTimer(false);
            }}
          />
        ) : (
          <button
            type="button"
            className={`cp-timer ${lowOnTime ? "cp-timer-low" : ""}`}
            onClick={openTimerEdit}
            title="Click to set a custom time limit"
          >
            {mm}:{ss}
          </button>
        )}
      </header>

      {timeUp && !passed && (
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
          <a
            className="cp-report-link"
            href={`https://github.com/rahulbaweja7/heisenbug/issues/new?title=${encodeURIComponent(
              `Issue with challenge ${challenge.meta.id}: ${challenge.meta.title}`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Report an issue with this challenge
          </a>
          <div className="cp-left-tabs">
            <button
              className={leftTab === "description" ? "cp-left-tab active" : "cp-left-tab"}
              onClick={() => setLeftTab("description")}
            >
              Description
            </button>
            <button
              className={leftTab === "solution" ? "cp-left-tab active" : "cp-left-tab"}
              onClick={() => setLeftTab("solution")}
            >
              Solution
            </button>
          </div>

          {leftTab === "description" && (
            <>
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
            </>
          )}

          {leftTab === "solution" && (
            <div className="cp-solution-panel">
              {solutionState === "loading" && (
                <div className="cp-solution-placeholder">Loading solution...</div>
              )}
              {solutionState === "unavailable" && (
                <div className="cp-solution-placeholder">
                  No solution write-up yet for this challenge.
                </div>
              )}
              {solutionState === "loaded" && solutionWriteup && (
                <div className="cp-explanation-body">
                  <Markdown text={solutionWriteup} />
                </div>
              )}
            </div>
          )}
        </aside>

        <ChallengeWorkspace
          key={challenge.meta.id}
          challenge={challenge}
          draftKey={`heisenbug:draft:${challenge.meta.id}`}
          onResult={handleWorkspaceResult}
        />
      </div>
    </div>
  );
}
