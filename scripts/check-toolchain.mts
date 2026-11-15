import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const nodeVersion = readFileSync(new URL("../.nvmrc", import.meta.url), "utf8").trim();
const { packageManager } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

assert.equal(
  process.version,
  `v${nodeVersion}`,
  "Node version differs from .nvmrc. Run nvm install && nvm use.",
);

const npmVersion = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();

assert.equal(
  `npm@${npmVersion}`,
  packageManager,
  `npm version differs from packageManager. Run npm install --global ${packageManager}.`,
);

console.log(`Toolchain verified: Node ${process.version}, npm ${npmVersion}`);
