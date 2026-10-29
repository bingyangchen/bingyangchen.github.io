import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkScenarios } from "../scripts/check-scenarios.mjs";

const SPEC = `---
prefix: SITE
---
### SITE-R1 Language
| 情境 | 條件、動作與結果 | 驗證方式 |
| --- | --- | --- |
| SITE-R1.1 Saved preference | A saved preference wins. | unit |
`;
const UNIT = 'test("SITE-R1.1 Saved preference", () => { expect(true).toBe(true); });';
const MANUAL = `## SITE-R1.1 Saved preference
原因：Requires human observation.
步驟：
1. Open the page.
預期結果：The saved language appears.
`;

async function checkFixture(files) {
  const root = await mkdtemp(join(tmpdir(), "scenario-check-"));
  try {
    for (const [path, content] of Object.entries(files)) {
      const target = join(root, path);
      await mkdir(join(target, ".."), { recursive: true });
      await writeFile(target, content);
    }
    return await checkScenarios(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function fixture(spec = SPEC, unit = UNIT) {
  return { "docs/specs/site.md": spec, "src/example.test.tsx": unit };
}

test("accepts executable tests and parameterized tests", async () => {
  for (const unit of [UNIT, 'test.each([1, 2])("SITE-R1.1 Saved preference", () => {});', 'it("SITE-R1.1 Saved preference", () => {});']) {
    assert.deepEqual((await checkFixture(fixture(SPEC, unit))).errors, []);
  }
});

test("requires every declared verification level", async () => {
  const files = fixture(SPEC.replace("| unit |", "| unit、browser、manual |"));
  let result = await checkFixture(files);
  assert.equal(result.errors.filter((error) => error.includes("missing")).length, 2);
  files["tests/browser/site.test.mjs"] = UNIT;
  files["tests/manual/site.md"] = MANUAL;
  assert.deepEqual((await checkFixture(files)).errors, []);
});

test("allows several tests to cover one scenario", async () => {
  assert.deepEqual((await checkFixture(fixture(SPEC, `${UNIT}\n${UNIT}`))).errors, []);
});

test("rejects tests that reference removed scenarios or wrong levels", async () => {
  const result = await checkFixture({ ...fixture(), "tests/browser/site.test.mjs": `${UNIT}\ntest("SITE-R8.1 Removed", () => {});` });
  assert.ok(result.errors.some((error) => error.includes("does not declare browser")));
  assert.ok(result.errors.some((error) => error.includes("unknown scenario SITE-R8.1")));
});

test("comments and example strings cannot satisfy test coverage", async () => {
  const result = await checkFixture(fixture(SPEC, `// ${UNIT}\nconst example = ${JSON.stringify(UNIT)};`));
  assert.ok(result.errors.some((error) => error.includes("missing unit")));
});

test("unused helpers and conditional registrations cannot satisfy coverage", async () => {
  for (const unit of [`function example() { ${UNIT} }`, `if (false) { ${UNIT} }`, `const example = () => { ${UNIT} };`]) {
    assert.ok((await checkFixture(fixture(SPEC, unit))).errors.some((error) => error.includes("missing unit")));
  }
  assert.deepEqual((await checkFixture(fixture(SPEC, `describe("Language", () => { ${UNIT} });`))).errors, []);
});

test("disabled tests and disabled ancestor suites cannot satisfy coverage", async () => {
  for (const unit of [UNIT.replace("test(", "test.skip("), UNIT.replace("test(", "test.todo("), `describe.skip("not active", () => { ${UNIT} });`, UNIT.replace("test(", "xit("), 'test("SITE-R1.1 Saved preference", { skip: true }, () => {});']) {
    assert.ok((await checkFixture(fixture(SPEC, unit))).errors.some((error) => error.includes("missing unit")), unit);
  }
});

test("focused tests are rejected rather than masking the rest of a suite", async () => {
  assert.ok((await checkFixture(fixture(SPEC, UNIT.replace("test(", "test.only(")))).errors.some((error) => error.includes("focused")));
});

test("malformed test titles and test syntax fail", async () => {
  for (const unit of ['test("SITE-R1.1 SITE-R1.x invalid", () => {});', 'test("SITE-R1.1 title", () => {']) {
    assert.ok((await checkFixture(fixture(SPEC, unit))).errors.length > 0);
  }
});

test("duplicate requirements and scenarios fail", async () => {
  const result = await checkFixture(fixture(`${SPEC}\n### SITE-R1 Duplicate\n| SITE-R1.1 Saved preference | duplicate | unit |`));
  assert.ok(result.errors.some((error) => error.includes("duplicate requirement")));
  assert.ok(result.errors.some((error) => error.includes("duplicate scenario")));
});

test("malformed rows and scenarios outside their requirement fail", async () => {
  for (const spec of [SPEC.replace("SITE-R1.1", "SITE-R1.x"), SPEC.replace("SITE-R1.1", "SITE-R2.1"), SPEC.replace("| unit |", "| unknown |"), SPEC.replace("### SITE-R1 Language", "### SITE-R1")]) {
    assert.ok((await checkFixture(fixture(spec))).errors.length > 0);
  }
});

test("scenario rows with misspelled or missing IDs cannot disappear from validation", async () => {
  for (const firstCell of ["SITE-r1.2 Typo", "site-R1.2 Typo", "R1.2 Missing prefix", "Missing ID"]) {
    const result = await checkFixture(fixture(SPEC + `| ${firstCell} | Uncovered rule | unit |\n`));
    assert.ok(result.errors.some((error) => error.includes("invalid scenario row")), firstCell);
  }
  assert.ok((await checkFixture(fixture(SPEC + "\n### SITE-r2 Broken\n"))).errors.some((error) => error.includes("invalid requirement")));
});

test("escaped table pipes do not create extra columns", async () => {
  assert.deepEqual((await checkFixture(fixture(SPEC.replace("A saved preference wins.", "Saved \\| browser")))).errors, []);
});

test("checker rejects files the configured test runners will not execute", async () => {
  for (const path of ["tests/browser/extra.spec.mjs", "tests/browser/nested/extra.test.mjs", "tests/browser/extra.test.ts", "src/extra.test.mjs"]) {
    const files = path.startsWith("src/")
      ? { ...fixture(SPEC, ""), [path]: UNIT }
      : { ...fixture(SPEC.replace("| unit |", "| browser |"), ""), [path]: UNIT };
    const result = await checkFixture(files);
    assert.ok(result.errors.some((error) => error.includes("unsupported")), path);
    assert.ok(result.errors.some((error) => error.includes("missing")), path);
  }
});

test("empty specs, missing prefix and empty requirements fail", async () => {
  for (const spec of ["", SPEC.replace("prefix: SITE", "prefix: site"), SPEC.split("| 情境")[0]]) {
    assert.ok((await checkFixture(fixture(spec))).errors.length > 0);
  }
});

test("a missing spec fails instead of passing an empty set", async () => {
  await assert.rejects(checkFixture({}), { code: "ENOENT" });
});

test("manual sections must be named correctly and have usable steps", async () => {
  const files = fixture(SPEC.replace("| unit |", "| manual |"), "");
  for (const manual of [MANUAL.replace("Saved preference", "Other name"), MANUAL.replace("預期結果：The saved language appears.", ""), `${MANUAL}\n${MANUAL}`]) {
    assert.ok((await checkFixture({ ...files, "tests/manual/site.md": manual })).errors.length > 0);
  }
  assert.deepEqual((await checkFixture({ ...files, "tests/manual/site.md": MANUAL })).errors, []);
});

test("unknown manual IDs and wrong manual files fail", async () => {
  const result = await checkFixture({ ...fixture(), "tests/manual/site.md": MANUAL.replace("SITE-R1.1", "SITE-R9.1"), "tests/manual/other.md": MANUAL });
  assert.ok(result.errors.some((error) => error.includes("unknown scenario")));
  assert.ok(result.errors.some((error) => error.includes("belong in")));
});

test("fenced examples and comments cannot manufacture scenarios or manual coverage", async () => {
  const example = "\n~~~md\n| SITE-R8.1 Example | Not a rule | manual |\n~~~\n<!--\n| SITE-R9.1 Hidden | Not a rule | manual |\n-->";
  assert.deepEqual((await checkFixture(fixture(SPEC + example))).errors, []);
  const result = await checkFixture({ ...fixture(SPEC.replace("| unit |", "| manual |"), ""), "tests/manual/site.md": `\`\`\`md\n${MANUAL}\n\`\`\`` });
  assert.ok(result.errors.some((error) => error.includes("missing manual")));
});

test("unclosed fences and comments fail even if IDs elsewhere are covered", async () => {
  for (const ending of ["\n```md\nexample", "\n<!-- hidden"]) {
    assert.ok((await checkFixture(fixture(SPEC + ending))).errors.some((error) => error.includes("unclosed")));
  }
});

test("fixture directories are not executable scenario coverage", async () => {
  const result = await checkFixture({ ...fixture(SPEC, ""), "src/fixtures/example.test.ts": UNIT });
  assert.ok(result.errors.some((error) => error.includes("missing unit")));
});
