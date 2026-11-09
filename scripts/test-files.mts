export const BROWSER_TEST_MATCH = "**/*.spec.ts";
export const BROWSER_TEST_IGNORE = ["**/fixtures/**", "**/__fixtures__/**"];

export function isBrowserTestFile(path: string) {
  return (
    path.endsWith(".spec.ts") &&
    !path.split(/[\\/]/).some((part) => ["fixtures", "__fixtures__"].includes(part))
  );
}
