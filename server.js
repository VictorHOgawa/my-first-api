import http from 'node:http';

export function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data))
}

http.createServer((req, res) => {
  const { method, url } = req;

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { "status": "ok" })
  } else {
    sendJson(res, 404, { "error": "Not Found" })
  }
})
  .listen(4000)
