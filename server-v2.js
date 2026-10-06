import http from 'node:http';

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {

    const { method, url, headers } = req;
    let body = [];

    req.on('error', err => {
      console.error("req_err: ", err);
    })
      .on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();

        res.on('error', err => {
          console.log("res_err: ", err)
        })

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');

        const resBody = { headers, method, url, body };
        res.write(JSON.stringify(resBody));
        res.end();
      })
  } else {
    const { method, url, headers } = req;
    let body = [];

    req.on('error', err => {
      console.error("req_err: ", err);
    })
      .on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();

        res.on('error', err => {
          console.log("res_err: ", err)
        })

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');

        const resBody = { headers, method, url, body };
        res.write(JSON.stringify(resBody));
        res.end();
      })
  }
})
  .listen(4000)
