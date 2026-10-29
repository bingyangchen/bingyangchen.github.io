import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCENARIO_ID = /\b[A-Z][A-Z0-9]*-R[1-9]\d*\.[1-9]\d*\b/g;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const LEVELS = new Set(["unit", "browser", "manual"]);

async function getFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory() && !["fixtures", "__fixtures__"].includes(entry.name)) {
      return getFiles(path);
    }
    return entry.isFile() ? [path] : [];
  }));
  return files.flat().sort();
}

function getMarkdownLines(source, report) {
  let fence;
  let inComment = false;
  const lines = [];
  source.split(/\r?\n/).forEach((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = undefined;
      }
      lines.push("");
      return;
    }
    if (marker && !inComment) {
      fence = marker[1];
      lines.push("");
      return;
    }
    let remaining = line;
    let visible = "";
    while (remaining) {
      const boundary = remaining.indexOf(inComment ? "-->" : "<!--");
      if (boundary < 0) {
        if (!inComment) visible += remaining;
        break;
      }
      if (!inComment) visible += remaining.slice(0, boundary);
      remaining = remaining.slice(boundary + (inComment ? 3 : 4));
      inComment = !inComment;
    }
    lines.push(visible);
  });
  if (fence) report("unclosed code fence");
  if (inComment) report("unclosed HTML comment");
  return lines;
}

function parseSpec(source, report) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const prefix = frontmatter?.[1].match(/^prefix: ([A-Z][A-Z0-9]*)$/m)?.[1];
  if (!prefix || frontmatter[1].trim() !== `prefix: ${prefix}`) {
    report("frontmatter must contain only prefix: UPPERCASE_PREFIX");
    return new Map();
  }
  const requirements = new Map();
  const scenarios = new Map();
  let currentRequirement;
  getMarkdownLines(source.slice(frontmatter[0].length), report).forEach((line) => {
    if (/^#{1,3} /.test(line)) currentRequirement = undefined;
    const heading = line.match(/^### (\S+) (.+)$/);
    if (/^### .*?-r/i.test(line) && !heading) report(`invalid requirement heading ${line}`);
    if (heading && /-r/i.test(heading[1])) {
      const id = heading[1];
      if (!new RegExp(`^${prefix}-R[1-9]\\d*$`).test(id)) report(`invalid requirement ${id}`);
      if (requirements.has(id)) report(`duplicate requirement ${id}`);
      requirements.set(id, 0);
      currentRequirement = id;
    }
    if (!line.startsWith("|")) return;
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim().replace(/\\\|/g, "|"));
    if (cells[0] === "情境" && cells[2] === "驗證方式") return;
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) return;
    if (!currentRequirement && !/-r/i.test(cells[0] ?? "")) return;
    const entry = cells[0].match(/^(\S+) (.+)$/);
    const id = entry?.[1] ?? cells[0];
    if (!entry || cells.length !== 3 || !new RegExp(`^${prefix}-R[1-9]\\d*\\.[1-9]\\d*$`).test(id)) {
      report(`invalid scenario row ${cells[0]}`);
      return;
    }
    const requirement = id.slice(0, id.lastIndexOf("."));
    if (requirement !== currentRequirement) report(`${id} is outside its requirement`);
    if (scenarios.has(id)) report(`duplicate scenario ${id}`);
    const levels = cells[2].split("、");
    if (!cells[1] || levels.some((level) => !LEVELS.has(level)) || new Set(levels).size !== levels.length) {
      report(`invalid expectation or verification levels for ${id}`);
    }
    scenarios.set(id, { name: entry[2], levels });
    requirements.set(requirement, (requirements.get(requirement) ?? 0) + 1);
  });
  for (const [id, count] of requirements) if (!count) report(`${id} has no scenarios`);
  if (!scenarios.size) report("spec has no scenarios");
  return scenarios;
}

function getCallParts(expression) {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (ts.isPropertyAccessExpression(expression)) return [...getCallParts(expression.expression), expression.name.text];
  if (ts.isCallExpression(expression)) return getCallParts(expression.expression);
  return [];
}

function isDisabled(call) {
  const parts = getCallParts(call.expression);
  if (parts.includes("skip") || parts.includes("todo") || parts[0] === "xit" || parts[0] === "xtest" || parts[0] === "xdescribe") return true;
  return call.arguments.some((argument) => ts.isObjectLiteralExpression(argument) && argument.properties.some((property) =>
    ts.isPropertyAssignment(property) && ["skip", "todo"].includes(property.name.getText().replace(/["']/g, "")) && property.initializer.kind !== ts.SyntaxKind.FalseKeyword));
}

function getTestIds(source, path, report) {
  const syntax = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  if (syntax.parseDiagnostics.length) report("test file has syntax errors");
  const ids = [];
  function visit(node, disabled = false) {
    if (ts.isSourceFile(node) || ts.isBlock(node)) {
      for (const statement of node.statements) visit(statement, disabled);
      return;
    }
    if (ts.isExpressionStatement(node)) {
      visit(node.expression, disabled);
      return;
    }
    if (ts.isCallExpression(node)) {
      const parts = getCallParts(node.expression);
      const root = parts[0];
      if (["test", "it", "describe", "suite", "xit", "xtest", "xdescribe"].includes(root)) {
        disabled ||= isDisabled(node);
        if (parts.includes("only")) report("focused test or suite is not allowed");
        const title = node.arguments[0];
        const hasBody = node.arguments.some((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument));
        if (["test", "it"].includes(root) && !disabled && title && hasBody && (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title))) {
          ids.push(...(title.text.match(SCENARIO_ID) ?? []));
          for (const token of title.text.match(/\b[A-Z][A-Z0-9]*-R[^\s\]]+/g) ?? []) {
            if (!/^[A-Z][A-Z0-9]*-R[1-9]\d*\.[1-9]\d*$/.test(token)) report(`invalid scenario ID in test title ${title.text}`);
          }
        }
        if (["describe", "suite", "xdescribe"].includes(root)) {
          for (const argument of node.arguments) {
            if ((ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) && ts.isBlock(argument.body)) visit(argument.body, disabled);
          }
        }
      }
    }
  }
  visit(syntax);
  return ids;
}

export async function checkScenarios(root) {
  const errors = [];
  const report = (path) => (message) => errors.push(`${relative(root, path)}: ${message}`);
  const specPath = resolve(root, "docs/specs/site.md");
  const scenarios = parseSpec(await readFile(specPath, "utf8"), report(specPath));
  const coverage = new Map([...scenarios.keys()].map((id) => [id, new Set()]));
  function addCoverage(id, level, path) {
    if (!scenarios.has(id)) report(path)(`unknown scenario ${id}`);
    else if (!scenarios.get(id).levels.includes(level)) report(path)(`${id} does not declare ${level}`);
    else coverage.get(id).add(level);
  }
  for (const [level, directory] of [["unit", "src"], ["browser", "tests/browser"]]) {
    for (const path of (await getFiles(resolve(root, directory))).filter((file) => TEST_FILE.test(file))) {
      const supported = level === "unit"
        ? /\.(?:test|spec)\.[jt]sx?$/.test(path)
        : dirname(path) === resolve(root, directory) && path.endsWith(".test.mjs");
      if (!supported) {
        report(path)(`unsupported ${level} test file; match the configured runner`);
        continue;
      }
      for (const id of getTestIds(await readFile(path, "utf8"), path, report(path))) addCoverage(id, level, path);
    }
  }
  for (const path of (await getFiles(resolve(root, "tests/manual"))).filter((file) => file.endsWith(".md"))) {
    if (relative(root, path) !== "tests/manual/site.md") {
      report(path)("manual scenarios belong in tests/manual/site.md");
      continue;
    }
    const lines = getMarkdownLines(await readFile(path, "utf8"), report(path));
    const sections = new Set();
    const starts = [];
    lines.forEach((line, index) => {
      if (/^#{1,2} /.test(line)) starts.push(index);
    });
    starts.forEach((index, sectionIndex) => {
      const line = lines[index];
      if (!line.startsWith("## ")) return;
      const heading = line.match(/^## (\S+) (.+)$/);
      if (!heading || !heading[1].match(/^[A-Z][A-Z0-9]*-R[1-9]\d*\.[1-9]\d*$/)) {
        report(path)(`invalid manual heading ${line}`);
        return;
      }
      const [, id, name] = heading;
      if (sections.has(id)) report(path)(`duplicate manual section ${id}`);
      sections.add(id);
      if (scenarios.has(id) && scenarios.get(id).name !== name) report(path)(`manual name differs for ${id}`);
      const body = lines.slice(index + 1, starts[sectionIndex + 1]).join("\n");
      if (!/原因：\S/.test(body) || !/步驟：\s*\n1\. \S/.test(body) || !/預期結果：\S/.test(body)) report(path)(`missing reason, steps or expected result for ${id}`);
      addCoverage(id, "manual", path);
    });
  }
  for (const [id, scenario] of scenarios) {
    for (const level of scenario.levels) if (!coverage.get(id).has(level)) errors.push(`${relative(root, specPath)}: ${id} missing ${level} coverage`);
  }
  return { errors, count: scenarios.size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkScenarios(resolve(fileURLToPath(new URL("../", import.meta.url))));
    if (result.errors.length) {
      console.error(result.errors.join("\n"));
      process.exitCode = 1;
    } else console.log(`Scenario links valid: ${result.count} scenarios`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
