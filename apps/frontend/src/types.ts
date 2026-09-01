export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4001";

export type Meta = {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  bugCategories: string[];
  filesVisible: string[];
};

export type Challenge = { meta: Meta; files: Record<string, string> };
export type SubmitResult = { passed: boolean; stdout: string; stderr: string };
