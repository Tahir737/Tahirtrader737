// Optional minimal health/API proxy. Never put secret provider keys in VITE_ variables.
import http from "node:http";
const port = Number(process.env.PORT || 8787);
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: "marketpulse-starter", time: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found", routes: ["/health"] }));
});
server.listen(port, "0.0.0.0", () => console.log(`MarketPulse helper listening on :${port}`));
