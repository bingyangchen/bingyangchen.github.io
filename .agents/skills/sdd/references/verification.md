# Spec and Verification Conventions

## Format and Stable IDs

Use the [spec template](../templates/spec.md). The frontmatter of `docs/specs/site.md` contains only `prefix: SITE`. Declare requirements as `### SITE-R1 名稱`, followed by scenarios in a three-column table. Keep the Chinese headers below: the checker parses this format.

```markdown
### SITE-R1 需求名稱

需求規則。

| 情境 | 條件、動作與結果 | 驗證方式 |
| --- | --- | --- |
| SITE-R1.1 情境名稱 | 條件、操作與可觀察結果。 | unit、manual |
```

Verification levels are `unit`, `browser`, and `manual`. Separate multiple levels with `、`; each declared level needs its own coverage. Put IDs in a literal title of an executable `test` or `it`, separated from other text by spaces. A title may reference several IDs.

- Put scenario tests where their runner discovers them. Keep discovery consistent with the checker. [Vitest config](../../../../vite.config.mts) · [Browser discovery](../../../../scripts/test-files.mts) · [Browser checks](../../../../docs/verification.md#browser-checks)
- Disabled tests or suites, todos, `fixme`, runtime `test.skip` or `test.fixme` annotations, comments, example strings, and fixture directories do not count as coverage. Conditional runtime disabling is conservatively excluded; an explicit `false` annotation remains executable. `.only` fails validation.
- Declare tests directly in a file or a `describe` or `suite` callback, not inside helpers, conditionals, or loops. Do not alias test functions or generate IDs dynamically. Parameterized tests may use `test.each`, with literal IDs in the title.
- Several tests may cover one scenario; requirement and scenario declarations must remain unique in the spec.

Never renumber IDs already committed to `main` for sorting or renaming, and never reuse removed numbers. Allocate new IDs against current specs, plans, archive history, and working-tree changes. When unimplemented plans collide, the later-submitted plan adjusts its IDs and every reference.

## Manual Checks

In `tests/manual/site.md`, use a level-two heading with the exact scenario ID and name, followed by the required Chinese labels:

```markdown
## SITE-R1.1 情境名稱

原因：需要人工判斷的理由。

步驟：
1. 執行第一個動作。
2. 檢查可觀察結果。

預期結果：對應規格的結果。
```

Put shared setup and navigation before the first scenario. Reserve level-two headings for scenarios. Link related [roadmap](../../../../docs/roadmap.md) issues from the relevant checks.

## Results and Reporting

Record check results and manual execution results in the commit body and delivery report, not in the procedure document. Existing issues may remain failed.

## Checks

For documentation-only changes, run at least `npm run check:scenarios`.

The scenario checker validates the format of the current spec and checks its links to declared coverage. Read the assertions when evaluating test quality.
