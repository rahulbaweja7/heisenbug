import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4001";

type Meta = {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  bugCategories: string[];
  filesVisible: string[];
};

type Challenge = { meta: Meta; files: Record<string, string> };
type SubmitResult = { passed: boolean; stdout: string; stderr: string };

function App() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/challenges/001-off-by-one-inventory`)
      .then((r) => r.json())
      .then((c: Challenge) => {
        setChallenge(c);
        setFileContents(c.files);
        setActiveFile(Object.keys(c.files)[0]);
        setSecondsLeft(c.meta.timeLimitMinutes * 60);
      });
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft > 0]);

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

  if (!challenge || !activeFile) {
    return <div className="loading">Loading challenge...</div>;
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">
          <span className="brand">Heisenbug</span>
          <span className="challenge-title">{challenge.meta.title}</span>
          <span className={`badge badge-${challenge.meta.difficulty}`}>
            {challenge.meta.difficulty}
          </span>
        </div>
        <div className="timer">{mm}:{ss}</div>
      </header>

      <div className="body">
        <aside className="file-tree">
          {Object.keys(challenge.files).map((path) => (
            <button
              key={path}
              className={path === activeFile ? "file active" : "file"}
              onClick={() => setActiveFile(path)}
            >
              {path}
            </button>
          ))}
        </aside>

        <main className="editor-pane">
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
        </main>

        <section className="output-pane">
          <button className="run-btn" onClick={handleSubmit} disabled={running}>
            {running ? "Running tests..." : "Run tests"}
          </button>
          {result && (
            <div className={`result ${result.passed ? "pass" : "fail"}`}>
              <div className="result-heading">
                {result.passed ? "All tests passed" : "Tests failed"}
              </div>
              <pre>{result.stdout}
{result.stderr}</pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
