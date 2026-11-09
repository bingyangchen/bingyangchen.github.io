import type { IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { open, realpath } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export async function startStaticServer(
  directory: string,
  { shell, shellRoutes = [] }: { shell?: string; shellRoutes?: string[] } = {},
) {
  const root = await realpath(directory);
  if (shellRoutes.length && typeof shell !== "string")
    throw new Error("Shell routes require an HTML shell");
  const isInsideRoot = (path: string) => path === root || path.startsWith(root + sep);
  const reportError = (error: unknown, request: IncomingMessage) =>
    console.error(
      new Error(`Static request failed: ${request.method} ${request.url}`, {
        cause: error,
      }),
    );
  const server = createServer(async (request, response) => {
    let file;
    try {
      let pathname;
      try {
        pathname = decodeURIComponent(
          new URL(request.url ?? "/", "http://localhost").pathname,
        );
        if (pathname.includes("\0")) throw new Error("NUL in URL");
      } catch {
        response.writeHead(400).end();
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }
      let path = resolve(root, `.${pathname}`);
      if (!isInsideRoot(path)) {
        response.writeHead(403).end();
        return;
      }
      if (shellRoutes.includes(pathname)) {
        response.writeHead(200, {
          "Content-Type": CONTENT_TYPES[".html"],
          "Cache-Control": "no-store",
          "Content-Length": Buffer.byteLength(shell!),
        });
        response.end(request.method === "HEAD" ? undefined : shell);
        return;
      }
      path = await realpath(path);
      if (!isInsideRoot(path)) {
        response.writeHead(403).end();
        return;
      }
      file = await open(path);
      if ((await file.stat()).isDirectory()) {
        await file.close();
        file = undefined;
        path = await realpath(join(path, "index.html"));
        if (!isInsideRoot(path)) {
          response.writeHead(403).end();
          return;
        }
        file = await open(path);
      }
      const metadata = await file.stat();
      if (response.destroyed) return;
      if (!metadata.isFile()) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "Content-Type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": "no-store",
      });
      if (request.method === "HEAD") response.end();
      else {
        const stream = file.createReadStream();
        file = undefined;
        stream.on("error", (error) => {
          reportError(error, request);
          response.destroy(error instanceof Error ? error : new Error(String(error)));
        });
        response.once("close", () => stream.destroy());
        stream.pipe(response);
      }
    } catch (error) {
      const missing =
        error instanceof Error &&
        "code" in error &&
        ["ENOENT", "ENOTDIR"].includes(String(error.code));
      if (!missing) reportError(error, request);
      if (response.headersSent)
        response.destroy(error instanceof Error ? error : new Error(String(error)));
      else response.writeHead(missing ? 404 : 500).end();
    } finally {
      try {
        await file?.close();
      } catch (error) {
        reportError(error, request);
        response.destroy(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });
  await new Promise<void>((resolveListening, rejectListening) => {
    server.once("error", rejectListening);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  let closePromise: Promise<void> | undefined;
  return {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () =>
      (closePromise ??= new Promise<void>((resolveClosed, rejectClosed) => {
        server.close((error) => (error ? rejectClosed(error) : resolveClosed()));
        server.closeAllConnections();
      })),
  };
}
