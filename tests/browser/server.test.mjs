import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { startStaticServer } from "../../scripts/serve-build.mjs";

test("strict preview serves actual files without exposing parent paths or symlink targets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "strict-preview-"));
  let server;
  try {
    const build = join(directory, "build");
    await mkdir(build);
    await writeFile(join(build, "index.html"), "<h1>Home</h1>");
    await writeFile(join(directory, "private.txt"), "outside root");
    await symlink(join(directory, "private.txt"), join(build, "linked.txt"));
    server = await startStaticServer(build);
    assert.equal(await (await fetch(server.origin)).text(), "<h1>Home</h1>");
    assert.equal((await fetch(server.origin + "/resume")).status, 404);
    assert.equal((await fetch(server.origin + "/%2e%2e%2fprivate.txt")).status, 403);
    assert.equal((await fetch(server.origin + "/linked.txt")).status, 403);
    assert.equal((await fetch(server.origin + "/%FF")).status, 400);
    const head = await fetch(server.origin, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  } finally {
    await server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
