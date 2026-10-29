import { createReadStream } from "node:fs";
import { stat, realpath } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
};

export async function startStaticServer(directory) {
  const root = await realpath(directory);
  const server = createServer(async (request, response) => {
    try {
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
      catch { response.writeHead(400).end(); return; }
      let path = resolve(root, `.${pathname}`);
      if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(path)).isDirectory()) path = join(path, "index.html");
      path = await realpath(path);
      if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      if (!(await stat(path)).isFile()) { response.writeHead(404).end(); return; }
      response.writeHead(200, { "Content-Type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      if (request.method === "HEAD") response.end();
      else createReadStream(path).on("error", () => response.destroy()).pipe(response);
    } catch (error) {
      response.writeHead(["ENOENT", "ENOTDIR"].includes(error.code) ? 404 : 500).end();
    }
  });
  await new Promise((resolveListening, rejectListening) => {
    server.once("error", rejectListening);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolveClosed, rejectClosed) => server.close((error) => error ? rejectClosed(error) : resolveClosed())) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startStaticServer(fileURLToPath(new URL("../build/", import.meta.url)));
  console.log(`Preview: ${server.origin} (no SPA fallback)`);
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { void server.close(); });
}
