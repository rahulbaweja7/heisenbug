const KEY = "heisenbug:solved";

export function getSolvedIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markSolved(id: string) {
  const solved = new Set(getSolvedIds());
  solved.add(id);
  localStorage.setItem(KEY, JSON.stringify(Array.from(solved)));
}
