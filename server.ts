import express, { type NextFunction, type Request, type Response } from 'express';
import pg from 'pg';


const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

interface NoteType {
  id: number;
  text: string;
  createdAt: string
}

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

app.get("/health", async (req, res) => {
  const result = await pool.query("SELECT 1");
  res.send({ "status": "ok", "db": "ok" });
});

app.get("/notes", async (req, res) => {
  const result = await pool.query('SELECT id, text, created_at AS "createdAt" FROM notes ORDER BY id');
  res.send(result.rows)
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

  const result = await pool.query('INSERT INTO notes (text) VALUES ($1) RETURNING id, text, created_at AS "createdAt"', [payload.text])
  res.status(201).json(result.rows[0]);
})

app.get("/notes/:id", async (req, res) => {
  const noteId = req.params.id;
  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })
  const result = await pool.query('SELECT id, text, created_at AS "createdAt", category_id AS "categoryId" FROM notes WHERE id = $1', [Number(noteId)])

  if (result.rows.length === 0) return res.status(404).send({ "error": "Note not found." })
  res.send(result.rows[0])
})

app.delete("/notes/:id", async (req, res) => {
  const noteId = req.params.id;

  if (!noteId || !Number.isInteger(Number(noteId))) return res.status(400).send({ "error": "ID is not a number" })

  const result = await pool.query('DELETE FROM notes WHERE id = $1', [Number(noteId)])
  if (result.rowCount === 0) return res.status(404).send({ "error": "Note not found." })
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
