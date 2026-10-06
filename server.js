import http from 'node:http';

let notes = [{ "id": 1, "text": "This is the first note", "createdAt": "2026-10-06T13:24:00.000Z" },
{ "id": 2, "text": "This is the second note", "createdAt": "2026-10-06T13:25:00.000Z" }];
let idCounter = notes.length;

export function sendJson(res, status, data, extraHeaders) {
  res.writeHead(status, { "Content-Type": "application/json", ...extraHeaders });
  res.end(JSON.stringify(data))
}


http.createServer((req, res) => {
  const { method } = req;
  const url = new URL(req.url, 'http://localhost').pathname
  if (url === "/health") {
    if (method === "GET") {
      sendJson(res, 200, { "status": "ok" })
    } else {
      sendJson(res, 405, { "error": "Method Not Allowed." }, { "Allow": "GET" })
    }
  } else if (url === "/notes") {
    if (method === "GET") {
      sendJson(res, 200, notes)
    } else
      if (method === "POST") {
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
      }
  } else if (url.split("/").length === 3 && url.split("/")[1] === "notes") {
    let IdText = url.split("/")[2];
    let chosenNote = notes.find((n) => n.id === Number(IdText))
    if (method === "GET") {
      if (IdText) {
        if (!Number.isInteger(Number(IdText))) {
          sendJson(res, 400, { "error": "ID is not a number" })
        } else if (!chosenNote) {
          sendJson(res, 404, { "error": "Note not found." })
        } else if (chosenNote) {
          sendJson(res, 200, chosenNote)
        }
      }
    } else if (method === "DELETE") {
      if (IdText) {
        let chosenNote = notes.find((n) => n.id === Number(IdText))
        if (!chosenNote) {
          sendJson(res, 404, { "error": "Note not found." })
        } else {
          notes = notes.filter((n) => n.id !== Number(IdText))
          sendJson(res, 204, null)
        }
      }
    } else {
      sendJson(res, 405, { "error": "Method Not Allowed." }, { "Allow": "GET, POST, DELETE" })
    }
  } else {
    sendJson(res, 404, { "error": "Not Found" })
  }
})
  .listen(4000)
