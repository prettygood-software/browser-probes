import { createReadStream } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";

export async function startLocalServer(root: string): Promise<Server> {
  const server = createServer((req, res) => {
    const reqUrl = req.url ?? "/";
    const safe = reqUrl.split("?", 1)[0] ?? "/";
    const rel = safe === "/" ? "/index.html" : safe;
    // Reject path-traversal before joining onto the docs root.
    if (rel.includes("..")) {
      res.writeHead(400).end("bad request");
      return;
    }
    const file = path.join(root, rel);
    if (!file.startsWith(root)) {
      res.writeHead(400).end("bad request");
      return;
    }
    res.setHeader("Content-Type", guessMime(file));
    const stream = createReadStream(file);
    stream.on("error", () => {
      res.writeHead(404).end("not found");
    });
    stream.pipe(res);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

export function serverPort(server: Server): number {
  const addr = server.address();
  if (addr === null || typeof addr === "string") {
    throw new Error("server has no port");
  }
  return addr.port;
}

export function guessMime(file: string): string {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}
