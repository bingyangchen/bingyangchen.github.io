import {
  mkdtemp,
  mkdir,
  writeFile,
  symlink,
  rm,
  open,
  chmod,
  type FileHandle,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startStaticServer } from "../../scripts/static-server.mts";
import assert from "node:assert/strict";
import { get, type ServerResponse } from "node:http";
import { subscribe, unsubscribe } from "node:diagnostics_channel";
import { mock } from "node:test";
import { type EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { test } from "../helpers/fixtures";

test("strict preview serves actual files without exposing parent paths or symlink targets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "strict-preview-"));
  let server: Awaited<ReturnType<typeof startStaticServer>> | undefined;
  try {
    const build = join(directory, "build");
    await mkdir(build);
    await writeFile(join(build, "index.html"), "<h1>Home</h1>");
    await writeFile(join(directory, "private.txt"), "outside root");
    await symlink(join(directory, "private.txt"), join(build, "linked.txt"));
    await mkdir(join(build, "linked-directory"));
    await symlink(
      join(directory, "private.txt"),
      join(build, "linked-directory/index.html"),
    );
    server = await startStaticServer(build);
    assert.equal(await (await fetch(server.origin)).text(), "<h1>Home</h1>");
    assert.equal((await fetch(server.origin + "/resume")).status, 404);
    assert.equal((await fetch(server.origin + "/%2e%2e%2fprivate.txt")).status, 403);
    assert.equal((await fetch(server.origin + "/linked.txt")).status, 403);
    assert.equal((await fetch(server.origin + "/linked-directory/")).status, 403);
    assert.equal((await fetch(server.origin + "/%FF")).status, 400);
    const head: Response = await fetch(server.origin, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  } finally {
    await server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("a request cancelled during file I/O closes its file handle", async () => {
  test.setTimeout(3000);
  const directory = await mkdtemp(join(tmpdir(), "server-abort-"));
  let server: Awaited<ReturnType<typeof startStaticServer>> | undefined;
  let handle: FileHandle | undefined;
  let statMock;
  let request;
  let resolveOpened!: () => void;
  let resolveResponseClosed!: () => void;
  let resolveFileClosed!: () => void;
  const opened = new Promise<void>((resolve) => {
    resolveOpened = resolve;
  });
  const responseClosed = new Promise<void>((resolve) => {
    resolveResponseClosed = resolve;
  });
  const fileClosed = new Promise<void>((resolve) => {
    resolveFileClosed = resolve;
  });
  const onRequest = (message: unknown) => {
    assert.ok(message && typeof message === "object" && "response" in message);
    (message.response as ServerResponse).once("close", resolveResponseClosed);
  };
  subscribe("http.server.request.start", onRequest);
  try {
    const path = join(directory, "asset.txt");
    await writeFile(path, "cancelled response");
    const sample = await open(path);
    const prototype = Object.getPrototypeOf(sample) as FileHandle;
    await sample.close();
    const originalStat = prototype.stat;
    statMock = mock.method(
      prototype,
      "stat",
      async function (
        this: FileHandle & EventEmitter,
        ...arguments_: Parameters<FileHandle["stat"]>
      ) {
        // Keep the interrupted handle observable while stat waits for response closure.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        handle = this;
        (handle as FileHandle & EventEmitter).once("close", resolveFileClosed);
        resolveOpened();
        await responseClosed;
        return originalStat.apply(this, arguments_);
      },
    );
    server = await startStaticServer(directory);
    request = get(server.origin + "/asset.txt");
    request.on("error", () => {});
    await opened;
    request?.destroy();
    await fileClosed;
    assert.equal(handle!.fd, -1);
  } finally {
    statMock?.mock.restore();
    unsubscribe("http.server.request.start", onRequest);
    request?.destroy();
    await handle?.close();
    await server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("build shell fallback is limited to exact approved routes and preserves real asset errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-server-"));
  let server: Awaited<ReturnType<typeof startStaticServer>> | undefined;
  try {
    await writeFile(join(directory, "index.html"), "<h1>Snapshot</h1>");
    await writeFile(join(directory, "app.js"), "export default 1;");
    await writeFile(join(directory, "resume.pdf"), "%PDF-fixture");
    await mkdir(join(directory, "nested"));
    await writeFile(join(directory, "nested/index.html"), "nested page");
    server = await startStaticServer(directory, {
      shell: "<h1>Compile shell</h1>",
      shellRoutes: ["/", "/resume"],
    });
    for (const path of ["/", "/resume", "/resume?print=1"])
      assert.equal(
        await (await fetch(server.origin + path)).text(),
        "<h1>Compile shell</h1>",
      );
    for (const path of [
      "/missing.png",
      "/missing.js",
      "/missing",
      "/resume/",
      "/resume/index.html",
    ])
      assert.equal((await fetch(server.origin + path)).status, 404, path);
    assert.equal(
      (await fetch(server.origin + "/app.js")).headers.get("content-type"),
      "text/javascript; charset=utf-8",
    );
    assert.equal(
      (await fetch(server.origin + "/resume.pdf")).headers.get("content-type"),
      "application/pdf",
    );
    assert.equal(await (await fetch(server.origin + "/nested/")).text(), "nested page");
    for (const path of ["/%FF", "/%00"])
      assert.equal((await fetch(server.origin + path)).status, 400);
    for (const path of ["/resume", "/app.js"]) {
      const head: Response = await fetch(server.origin + path, { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), "");
    }
    const post = await fetch(server.origin + "/resume", { method: "POST" });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("allow"), "GET, HEAD");
    assert.equal((await fetch(server.origin)).status, 200);
  } finally {
    await server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("unexpected file I/O failures return 500 with their cause and keep the server usable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "server-io-"));
  let server: Awaited<ReturnType<typeof startStaticServer>> | undefined;
  const file = join(directory, "private.txt");
  const errors: Error[] = [];
  const logger = mock.method(console, "error", (error: Error) => errors.push(error));
  try {
    await writeFile(join(directory, "index.html"), "healthy");
    await writeFile(file, "unreadable");
    await chmod(file, 0);
    server = await startStaticServer(directory);
    assert.equal((await fetch(server.origin + "/private.txt")).status, 500);
    assert.equal(errors.length, 1);
    assert.equal((errors[0].cause as NodeJS.ErrnoException).code, "EACCES");
    assert.match(errors[0].message, /GET \/private.txt/);
    assert.equal(await (await fetch(server.origin)).text(), "healthy");
  } finally {
    logger.mock.restore();
    await chmod(file, 0o600);
    await server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("stream failures abort the response and report the read error", async () => {
  const directory = await mkdtemp(join(tmpdir(), "server-stream-"));
  let server: Awaited<ReturnType<typeof startStaticServer>> | undefined;
  let streamMock;
  const errors: Error[] = [];
  const logger = mock.method(console, "error", (error: Error) => errors.push(error));
  try {
    const path = join(directory, "asset.txt");
    await writeFile(path, "expected bytes");
    const handle = await open(path);
    const prototype = Object.getPrototypeOf(handle) as FileHandle;
    await handle?.close();
    streamMock = mock.method(
      prototype,
      "createReadStream",
      function (this: FileHandle) {
        const closeFile = this.close.bind(this);
        return new Readable({
          read() {
            this.destroy(new Error("fixture read failure"));
          },
          destroy(error, callback) {
            closeFile().then(() => callback(error), callback);
          },
        });
      },
    );
    server = await startStaticServer(directory);
    await assert.rejects(async () => {
      const response = await fetch(server!.origin + "/asset.txt");
      await response.arrayBuffer();
    });
    assert.equal(errors.length, 1);
    assert.equal((errors[0].cause as Error).message, "fixture read failure");
  } finally {
    streamMock?.mock.restore();
    logger.mock.restore();
    await server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
