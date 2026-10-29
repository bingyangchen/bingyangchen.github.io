---
name: sdd
description: Spec-driven workflow for changes to this personal website. Use before changing code, docs or configuration, and for plan, implement, change, backfill or abandon requests.
---

## Document Model

<!-- prettier-ignore -->
| Document | Responsibility |
| --- | --- |
| [Design context](../../../docs/design.md) | Product direction, audience, tone, main sections, and shared visual principles. |
| [Site spec](../../../docs/specs/site.md) | Current behavior rules, requirements, scenarios, and necessary rationale. Link unresolved issues to the roadmap. |
| [Roadmap](../../../docs/roadmap.md) | Future requirement goals under `需求願景`, known issues, and questions awaiting investigation or product decisions, with evidence, related requirement IDs, and links to follow-up plans when needed. |
| [Engineering instructions](../../../AGENTS.md), [README](../../../README.md) | Engineering constraints, commands, and workflow entry points. |
| `docs/plans/NNNN-slug.md` | Draft or approved unfinished plans, including proposed spec changes, designs, and verification methods. |
| `docs/plans/archive/` | Completed or abandoned plans and attachments, for historical reference only. |
| [Manual checks](../../../tests/manual/site.md) | Scenarios needing human judgment, repeatable steps, and expected results. |
| `design/` | Designs or prototypes reviewed with a plan; behavior rules still belong in the plan and spec. |

Start with one site spec; split a growing section through a plan when needed. Keep the roadmap as a simple list; leave `需求願景` empty when no agreed items exist. Record dependencies directly in plans. When archiving or abandoning plans, update their roadmap links and retain unresolved items. Do not copy content data or verbatim product copy into the spec.

## Choose the Entry Point

<!-- prettier-ignore -->
| Entry point | Changes it handles |
| --- | --- |
| `plan` | New or changed features, interactions, information architecture, architecture, or substantial layout changes. Also use it when intended behavior is not defined. |
| `implement <id>` | Implement the plan version the user confirmed, within its recorded approved scope. |
| `change` | Restore specified behavior, or make behavior-preserving refactoring, performance, or tooling changes. |
| `backfill` | Document existing implementation without changing behavior. |
| `abandon <id>` | Abandon an unfinished plan, resolve dependents, and preserve the reason. |

Handle trivial typos, punctuation, formatting, factual career updates, and local spacing directly with applicable verification. Classify by meaning, not line count: copy that changes a promise, data that changes product scope, or styling that changes a primary action still requires `plan`. If `change` requires deciding new behavior, switch to `plan` first.

Track discrepancies and undecided product behavior in the roadmap, not as spec requirements or approved fixes. Update or remove roadmap items as their evidence, decisions, or verified resolutions change.

For all entry points and trivial changes, follow the [verification conventions](references/verification.md) for applicable checks and result reporting.

## Approval and Git Rules

- Work on `main`; when instructed to commit, commit directly to `main`. This repo does not use a PR workflow. Push requires explicit user instruction separately; a local commit does not authorize a push.
- Plans start with `status: draft`. Only after explicit user confirmation, set `approved` and record the confirmation date and scope under `核准紀錄`. Commit the approved plan separately before implementation.
- Plan numbering starts at `0001`. Take the highest number among current and archived plans plus one, and resolve collisions before committing.
- Plan statuses are `draft`, `approved`, `done`, and `abandoned`. Keep `approved` during implementation; set `done` only after verification is complete.
- The spec in a `main` commit describes behavior implemented by that commit. Keep unimplemented changes in plans; update code, spec, and verification documents in the same commit.
- To revise approved scope, behavior, or substantial design, return the revised plan to `draft`, preserve the previous approval record, and obtain renewed confirmation before implementing the revision.

## Plan

1. Read the design context, site spec, roadmap, relevant engineering documents, and unfinished plans.
2. Write the plan using the [plan template](templates/plan.md). Link addressed roadmap items to the plan without duplicating its detailed rules. Do not prescribe a step-by-step implementation checklist.
3. Substantial UI changes require reviewable designs showing layout, copy, and key states. Provide a prototype when interaction must be tried to judge it. Local styling changes do not require a design artifact. Propose complete wording for any changes to design direction too.
4. Assign verification methods to every added or modified scenario using the [verification conventions](references/verification.md). State where lasting decision rationale will live in the spec or engineering documents.
5. Have a reviewer without the planning conversation check completeness, consistency, verifiability, and designs. Resolve every scope-affecting question before asking the user to confirm the plan.
6. After confirmation and the separate plan commit, proceed to `implement`.

If affected existing behavior has no spec, establish its baseline with `backfill` first.

## Implement

1. On `main`, verify the plan's `approved` status, approval record, scope, and separate commit of that approved version. Each `depends_on` entry must have an archived plan with `status: done`.
2. Implement the approved plan, updating code, the site spec, automated tests, manual procedures, and lasting decision rationale together.
3. Run `npm run check`.
4. Run independent code review.
5. Set the completed plan to `done` and move it and its attachments to `docs/plans/archive/`. Update or remove the roadmap items actually resolved and verified. Include implementation, spec, verification changes, roadmap updates, and plan archival in the same commit.

Do not edit an archived plan after its archival commit; use the current spec for subsequent behavior.

## Change, Backfill, and Abandon

- `change`: after confirmation, implement, run applicable checks and review. Behavior-preserving changes need no plan; new intended behavior requires `plan`.
- `backfill`: compare code with actual operation and document normal behavior with scenario coverage. Do not fix product behavior; ask the user to decide uncertain intent.
- `abandon`: identify unfinished dependents and confirm replacement, cancellation, or revision first. Set the approved plan to `abandoned` and archive it with its reason and replacement if any. Unapproved drafts may be removed directly.

## Language

Keep this skill, its supporting instructions, and template guidance in English. Generated specs, the roadmap, plans, manual procedures, commit bodies, and delivery reports use Traditional Chinese with Taiwan usage. Keep generated document headings and parser-required labels in Traditional Chinese. Filenames, IDs, frontmatter, and commit titles use English.
