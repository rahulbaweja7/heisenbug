import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { API_BASE, type Challenge, type SubmitResult } from "./types";
import Markdown from "./Markdown";
import FileTree from "./FileTree";
import { markSolved } from "./progress";
import "./ChallengePage.css";
import WorkspacePanel, { type WorkspaceHandle } from './workspace/WorkspacePanel';
import { api } from './workspace/api';
import { eventSessionId, track } from './analytics';
import { useIdentity } from './IdentityContext';

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedPath, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const activeFile = selectedPath && selectedPath in fileContents ? selectedPath : Object.keys(fileContents)[0] || null;
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [running, setRunning] = useState(false);
  const [executionError, setExecutionError] = useState('');
  const workspace = useRef<WorkspaceHandle>(null);
  const submissionRequest = useRef<string | null>(null);
  const { refresh } = useIdentity();
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

  useEffect(() => {
    setChallenge(null);
    setResult(null);
    setExplanation(null);
    setLoadError(false);
    setLeftTab("description");
    setSolutionWriteup(null);
    setSolutionState("idle");
    setEditingTimer(false);
    fetch(`${API_BASE}/api/challenges/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((c: Challenge) => {
        setChallenge(c);
        let files = c.files;
        try {
          const draft = JSON.parse(localStorage.getItem(`heisenbug:draft:${c.meta.id}`) || 'null');
          if (draft && typeof draft === 'object' && !Array.isArray(draft) && Object.values(draft).every(value => typeof value === 'string')) files = draft;
        } catch { /* Browser storage can be unavailable. */ }
        setFileContents(files);
        setActiveFile(Object.keys(files)[0] || null);
        setSecondsLeft(c.meta.timeLimitMinutes * 60);
        track('challenge_view', c.meta.id);
      })
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    if (!challenge || challenge.meta.id !== id) return;
    try { localStorage.setItem(`heisenbug:draft:${id}`, JSON.stringify(fileContents)); } catch { /* Editing remains usable if storage is full. */ }
  }, [fileContents, challenge, id]);

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
    setExecutionError('');
    try {
      track('practice_start', challenge.meta.id);
      const files = await workspace.current?.flush() || fileContents;
      submissionRequest.current ||= crypto.randomUUID();
      const response = await api<SubmitResult>(`/api/challenges/${challenge.meta.id}/submit`, { method: 'POST', body: JSON.stringify({ files, requestId: submissionRequest.current, analyticsSessionId: eventSessionId() }) });
      submissionRequest.current = null;
      setResult(response);
      await refresh();
    } catch (error) {
      setExecutionError((error as Error).message);
    } finally {
      setRunning(false);
    }
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

  function handleReset() {
    if (!challenge) return;
    if (!confirm("Reset all files back to the starter code? This can't be undone.")) {
      return;
    }
    setFileContents(challenge.files);
    setResult(null);
    setExplanation(null);
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

        <aside className="cp-explorer">
          <div className="cp-explorer-heading">Explorer</div>
          <FileTree
            paths={Object.keys(fileContents)}
            activeFile={activeFile || ''}
            onSelect={setActiveFile}
          />
        </aside>

        <main className="cp-workspace">
          <div className="cp-file-tabs">
            <div className="cp-file-tabs-scroll">
              {Object.keys(fileContents).map((path) => (
                <button
                  key={path}
                  className={path === activeFile ? "cp-tab active" : "cp-tab"}
                  onClick={() => setActiveFile(path)}
                >
                  {path}
                </button>
              ))}
            </div>
            <div className="cp-file-tabs-spacer" />
            <button className="cp-reset-btn" onClick={() => {
              const name = prompt('New file path, for example scratch.py');
              if (!name) return;
              if (!/^[a-zA-Z0-9_./-]+$/.test(name) || name.split('/').some(part => !part || part === '.' || part === '..') || name.startsWith('tests/')) { setExecutionError('Use a relative file path outside tests/.'); return; }
              setFileContents(previous => ({ ...previous, [name]: previous[name] ?? '' })); setActiveFile(name);
            }}>New file</button>
            <button className="cp-reset-btn" onClick={handleReset}>
              Reset
            </button>
            <button className="cp-run-btn" onClick={handleSubmit} disabled={running}>
              {running ? "Running..." : "Run tests"}
            </button>
          </div>

          <div className="cp-editor-pane">
            {activeFile ? <Editor
              height="100%"
              language={activeFile.endsWith('.html') ? 'html' : activeFile.endsWith('.md') ? 'markdown' : challenge.meta.language}
              path={`${challenge.meta.id}/${activeFile}`}
              value={fileContents[activeFile]}
              onChange={(value) => { track('practice_start', challenge.meta.id); setFileContents((prev) => ({ ...prev, [activeFile]: value ?? "" })); }}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            /> : <p className="ws-empty">Create a file to begin editing.</p>}
          </div>

          <WorkspacePanel key={challenge.meta.id} ref={workspace} challengeId={challenge.meta.id} files={fileContents} setFiles={setFileContents} />

          <div className="cp-console">
            {executionError && <div className="ws-error" role="alert">{executionError}</div>}
            {!result && (
              <div className="cp-console-placeholder">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="cp-console-icon"
                >
                  <path d="M8 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 15h3" strokeLinecap="round" />
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                </svg>
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
