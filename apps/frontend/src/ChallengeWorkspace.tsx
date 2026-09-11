import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { type Challenge, type SubmitResult } from "./types";
import FileTree from "./FileTree";
import WorkspacePanel, { type WorkspaceHandle } from './workspace/WorkspacePanel';
import { api } from './workspace/api';
import { eventSessionId, track } from './analytics';
import { useIdentity } from './IdentityContext';
import Modal from './Modal';
import "./ChallengePage.css";

type Props = {
  challenge: Challenge;
  draftKey: string;
  onResult?: (result: SubmitResult) => void;
};

function loadFiles(challenge: Challenge, draftKey: string): Record<string, string> {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (draft && typeof draft === 'object' && !Array.isArray(draft) && Object.keys(draft).length > 0 && Object.values(draft).every(value => typeof value === 'string')) return draft;
  } catch { /* Browser storage can be unavailable. */ }
  return challenge.files;
}

// Callers must remount this component per challenge (e.g. key={challenge.meta.id})
// so this initial state is only ever computed once per challenge/draftKey pair --
// otherwise a challenge switch would briefly persist the previous challenge's
// files under the new draftKey before the next render catches up.
export default function ChallengeWorkspace({ challenge, draftKey, onResult }: Props) {
  const [selectedPath, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => loadFiles(challenge, draftKey));
  const activeFile = selectedPath && selectedPath in fileContents ? selectedPath : Object.keys(fileContents)[0] || null;
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [running, setRunning] = useState(false);
  const [executionError, setExecutionError] = useState('');
  const workspace = useRef<WorkspaceHandle>(null);
  const submissionRequest = useRef<string | null>(null);
  const { refresh } = useIdentity();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newFileDialog, setNewFileDialog] = useState<{ value: string; error: string } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify(fileContents)); } catch { /* Editing remains usable if storage is full. */ }
  }, [fileContents, draftKey]);

  async function handleSubmit() {
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
      onResult?.(response);
      await refresh();
    } catch (error) {
      setExecutionError((error as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    setShowResetConfirm(true);
  }

  function confirmReset() {
    setFileContents(challenge.files);
    setResult(null);
    setShowResetConfirm(false);
  }

  function confirmNewFile() {
    if (!newFileDialog) return;
    const name = newFileDialog.value.trim();
    if (!name) { setNewFileDialog(null); return; }
    if (!/^[a-zA-Z0-9_./-]+$/.test(name) || name.split('/').some(part => !part || part === '.' || part === '..') || name.startsWith('tests/')) {
      setNewFileDialog({ ...newFileDialog, error: 'Use a relative file path outside tests/.' });
      return;
    }
    setFileContents(previous => ({ ...previous, [name]: previous[name] ?? '' }));
    setActiveFile(name);
    setNewFileDialog(null);
  }

  return (
    <>
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
          <button className="cp-reset-btn" onClick={() => setNewFileDialog({ value: '', error: '' })}>New file</button>
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

      {showResetConfirm && (
        <Modal
          title="Reset files?"
          message="This resets every file back to the starter code. Your current changes can't be recovered."
          confirmLabel="Reset"
          danger
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {newFileDialog && (
        <Modal
          title="New file"
          message="File path relative to the project root, for example scratch.py."
          input={{
            value: newFileDialog.value,
            onChange: (value) => setNewFileDialog({ value, error: "" }),
            placeholder: "scratch.py",
          }}
          error={newFileDialog.error}
          confirmLabel="Create"
          onConfirm={confirmNewFile}
          onCancel={() => setNewFileDialog(null)}
        />
      )}
    </>
  );
}
