import http from 'node:http';

let notes = [
  { "id": 1, "text": "This is the first note", "createdAt": "2026-10-06T13:24:00.000Z" },
  { "id": 2, "text": "This is the second note", "createdAt": "2026-10-06T13:25:00.000Z" }
];
let idCounter = notes.length;

const sendJsonCORSHeaders = { "Access-Control-Allow-Origin": "http://localhost:3000" }

const preflightCORSHeaders = {
  ...sendJsonCORSHeaders,
  "Access-Control-Allow-Methods": "GET, POST, DELETE", "Access-Control-Allow-Headers": "Content-type", "Access-Control-Max-Age": 600
}

export function sendJson(res, status, data, extraHeaders) {
  res.writeHead(status, { "Content-Type": "application/json", ...sendJsonCORSHeaders, ...extraHeaders });
  res.end(JSON.stringify(data))
}

const handleHealth = ((req, res) => {
  if (req.method === "GET") {
    sendJson(res, 200, { "status": "ok" })
  } else {
    sendJson(res, 405, { "error": "Method Not Allowed." }, { "Allow": "GET" })
  }
})

const handleNotes = ((req, res) => {
  if (req.method === "GET") {
    sendJson(res, 200, notes)
  } else if (req.method === "POST") {
    let body = [];
    req.on('data', chunk => {
      body.push(chunk);
    })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        let payload;
        try {
          payload = JSON.parse(body)
        } catch {
          return sendJson(res, 400, { "error": "The note is malformed, try again." })
        }
        if (typeof (payload?.text) !== "string" || payload.text.trim() === "") {
          return sendJson(res, 400, { "error": "The note is either empty or malformed, try again." })
        }
        idCounter += 1;
        const newNote = { id: idCounter, text: payload.text, createdAt: new Date().toISOString() }
        notes.push(newNote);
        sendJson(res, 201, { "message": "New note added successfully.", newNote })
      })
  } else {
    sendJson(res, 405, { "error": "Method Not Allowed" }, { "Allow": "GET, POST" })
  }
})

const handleNoteById = ((req, res, idText) => {
  let chosenNote = notes.find((n) => n.id === Number(idText))

  if (!idText || !Number.isInteger(Number(idText))) return sendJson(res, 400, { "error": "ID is not a number" })

  if (!chosenNote) return sendJson(res, 404, { "error": "Note not found." })

  if (req.method === "GET") {
    sendJson(res, 200, chosenNote)
  } else if (req.method === "DELETE") {
    notes = notes.filter((n) => n.id !== Number(idText))
    res.writeHead(204);
    // 204 No Content must not include a body
    res.end();
  } else {
    sendJson(res, 405, { "error": "Method Not Allowed." }, { "Allow": "GET, DELETE" })
  }
})

const handleRequest = (req, res) => {
  const url = new URL(req.url, "http://localhost").pathname;
  // "/notes/2".split("/") → ["", "notes", "2"]: the leading "/" produces an empty first item
  const parts = url.split("/");

  if (req.method === "OPTIONS") {
    res.writeHead(204, preflightCORSHeaders);
    return res.end();
  }

  if (url === "/health") {
    handleHealth(req, res);
  } else if (url === "/notes") {
    handleNotes(req, res)
  } else if (parts.length === 3 && parts[1] === "notes") {
    handleNoteById(req, res, parts[2]);
  } else {
    sendJson(res, 404, { "error": "Not Found" })
  }
}

http.createServer(handleRequest).listen(4000)
