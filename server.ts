import express, { type NextFunction, type Request, type Response } from 'express';
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });


interface NoteType {
  id: number;
  text: string;
  createdAt: string
}

const CORS_ORIGIN_HEADERS = { "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "http://localhost:3000" }

const preflightCORSHeaders = {
  ...CORS_ORIGIN_HEADERS,
  "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH", "Access-Control-Allow-Headers": "Content-type", "Access-Control-Max-Age": 600
}

const app = express();

app.disable("x-powered-by")

app.use((req, res, next) => {
  res.set(CORS_ORIGIN_HEADERS);
  if (req.method === "OPTIONS") {
    res.set(preflightCORSHeaders);
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

app.get("/health", async (req, res) => {
  const result = await prisma.$queryRaw`SELECT 1`
  res.send({ "status": "ok", "db": "ok" });
});

app.get("/notes", async (req, res) => {
  const notes = await prisma.note.findMany({ orderBy: [{ pinned: "desc" }, { id: "asc" }] })
  res.send(notes)
})

app.post("/notes", async (req, res) => {
  let payload: unknown;
  payload = req.body;

  if (typeof payload !== "object" || payload === null) return res.status(400).send({ "error": "The note is malformed, try again." });

  if (!("text" in payload)) return res.status(400).send({ "error": "The note is malformed, try again." });

  if (typeof payload.text !== "string") return res.status(400).send({ "error": "The note is malformed, try again." });

  if (payload.text.trim() === "") {
    return res.status(400).send({ "error": "The note is either empty or malformed, try again." })
  }

  const note = await prisma.note.create({ data: { text: payload.text } })
  res.status(201).json(note);
})

app.get("/notes/:id", async (req, res) => {
  const noteId = req.params.id;
  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })
  const note = await prisma.note.findUnique({ where: { id: Number(noteId) } })

  if (!note) return res.status(404).send({ "error": "Note not found." })
  res.send(note)
})

app.patch("/notes/:id", async (req, res) => {
  const noteId = req.params.id;
  let payload: unknown;
  payload = req.body;
  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })

  if (typeof payload !== "object" || payload === null) return res.status(400).send({ "error": "The note is malformed, try again." });

  if (!("pinned" in payload)) return res.status(400).send({ "error": "The note is malformed, try again." });

  if (typeof payload.pinned !== "boolean") return res.status(400).send({ "error": "The note is malformed, try again." });

  try {
    const note = await prisma.note.update({ where: { id: Number(noteId) }, data: { pinned: payload.pinned } })
    return res.json(note)
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2025") {
      return res.status(404).json({ error: "Note not found." });
    } else {
      throw e;
    }
  }
})

app.delete("/notes/:id", async (req, res) => {
  const noteId = req.params.id;

  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })

  const note = await prisma.note.deleteMany({ where: { id: Number(noteId) } })
  if (note.count === 0) return res.status(404).send({ "error": "Note not found." })
  res.status(204).end();
})

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  console.error(err);
  res.status(500).send({ "error": "Internal server error" });
});

app.use((req, res) => {
  res.status(404).send({ "error": "not found" })
})



app.listen(Number(process.env.PORT) || 4000);
