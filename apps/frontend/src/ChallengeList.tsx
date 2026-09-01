import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, type Meta } from "./types";
import "./ChallengeList.css";

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
      <header className="list-header">
        <span className="brand">Heisenbug</span>
        <p className="tagline">Practice the new Amazon-style debugging OA format.</p>
      </header>

      <div className="filters">
        <label>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div className="loading">Loading challenges...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty">No challenges match these filters.</div>
      )}

      <ul className="challenge-cards">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link to={`/challenge/${c.id}`} className="challenge-card">
              <div className="card-top">
                <span className="card-title">{c.title}</span>
                <span className={`badge badge-${c.difficulty}`}>{c.difficulty}</span>
              </div>
              <div className="card-meta">
                <span>{c.language}</span>
                <span>{c.timeLimitMinutes} min</span>
              </div>
              <div className="card-tags">
                {c.bugCategories.map((cat) => (
                  <span key={cat} className="tag">
                    {cat}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
