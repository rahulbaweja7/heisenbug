import Fastify from "fastify";
import cors from "@fastify/cors";
import { listChallenges, getChallenge, getExplanation, getSolutionWriteup } from "./challenges.js";
import { runSubmission } from "./runner.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get("/api/health", async () => ({ ok: true }));

app.get("/api/challenges", async () => {
  return listChallenges();
});

app.get("/api/challenges/:id", async (req, reply) => {
  try {
    return await getChallenge(req.params.id);
  } catch {
    reply.code(404);
    return { error: "challenge not found" };
  }
});

app.get("/api/challenges/:id/explanation", async (req, reply) => {
  try {
    const markdown = await getExplanation(req.params.id);
    return { markdown };
  } catch {
    reply.code(404);
    return { error: "explanation not found" };
  }
});

app.get("/api/challenges/:id/solution-writeup", async (req, reply) => {
  try {
    const markdown = await getSolutionWriteup(req.params.id);
    return { markdown };
  } catch {
    reply.code(404);
    return { error: "solution writeup not found" };
  }
});

app.post("/api/challenges/:id/submit", async (req, reply) => {
  const { files } = req.body ?? {};
  if (!files || typeof files !== "object") {
    reply.code(400);
    return { error: "expected { files: { [path]: contents } }" };
  }
  return runSubmission(req.params.id, files);
});

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
