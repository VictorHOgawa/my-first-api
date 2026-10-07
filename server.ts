import express, { type NextFunction, type Request, type Response } from 'express';

interface NoteType {
  id: number;
  text: string;
  createdAt: string
}

let notes: NoteType[] = [
  { "id": 1, "text": "This is the first note", "createdAt": "2026-10-06T13:24:00.000Z" },
  { "id": 2, "text": "This is the second note", "createdAt": "2026-10-06T13:25:00.000Z" }
];
let idCounter = notes.length;

const CORS_ORIGIN_HEADERS = { "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "http://localhost:3000" }

const preflightCORSHeaders = {
  ...CORS_ORIGIN_HEADERS,
  "Access-Control-Allow-Methods": "GET, POST, DELETE", "Access-Control-Allow-Headers": "Content-type", "Access-Control-Max-Age": 600
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

app.get("/health", (req, res) => {
  res.send({ "status": "ok" });
});

app.get("/notes", (req, res) => {
  res.send(notes)
})

app.post("/notes", (req, res) => {
  let payload: unknown;
  payload = req.body;

  if (typeof payload !== "object" || payload === null) return res.status(400).send({ "error": "The note is malformed, try again." });

  if (!("text" in payload)) return res.status(400).send({ "error": "The note is malformed, try again." });

  if (typeof payload.text !== "string") return res.status(400).send({ "error": "The note is malformed, try again." });

  if (payload.text.trim() === "") {
    return res.status(400).send({ "error": "The note is either empty or malformed, try again." })
  }
  idCounter += 1;

  const newNote = { "id": idCounter, "text": payload.text, "createdAt": new Date().toISOString() };
  notes.push(newNote);
  res.status(201).json(newNote);
})

app.get("/notes/:id", (req, res) => {
  const noteId = req.params.id;
  const chosenNote = notes.find((n) => n.id === Number(noteId))
  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })

  if (!chosenNote) return res.status(404).send({ "error": "Note not found." })
  res.send(chosenNote)
})

app.delete("/notes/:id", (req, res) => {
  const noteId = req.params.id;
  const chosenNote = notes.find((n) => n.id === Number(noteId))
  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })

  if (!chosenNote) return res.status(404).send({ "error": "Note not found." })
  notes = notes.filter((n) => n.id !== Number(noteId))
  res.status(204).end();
})

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ error: "Invalid JSON" });
});

app.use((req, res) => {
  res.status(404).send({ "error": "not found" })
})



app.listen(Number(process.env.PORT) || 4000);
