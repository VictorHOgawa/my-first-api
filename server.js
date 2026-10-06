import http from 'node:http';

let notes = [{ "id": 1, "text": "This is the first note", "createdAt": "2026-10-06T13:24:00.000Z" },
{ "id": 2, "text": "This is the second note", "createdAt": "2026-10-06T13:25:00.000Z" }
];

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
      sendJson(res, 200, notes);
    } else {
      sendJson(res, 405, { "error": "Method Not Allowed." }, { "Allow": "GET" })
    }
  } else {
    sendJson(res, 404, { "error": "Not Found" })
  }
})
  .listen(4000)
