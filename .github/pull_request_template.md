## Summary

<!-- What does this PR do and why? One paragraph max. -->

## Changes

<!-- Bullet list of what changed. No file paths — describe behavior, not implementation. -->

-

## Type

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — no behavior change
- [ ] `perf` — performance improvement
- [ ] `test` — tests only
- [ ] `docs` — documentation only
- [ ] `chore` — build, config, dependencies, CI

## Test plan

<!-- How was this tested? Steps to verify manually if applicable. -->

- [ ] Unit/integration tests updated or added
- [ ] Tested locally against a running instance
- [ ]

## Breaking changes

<!-- Does this change the public API, database schema, or env variables? -->

- [ ] No breaking changes
- [ ] Yes — describe impact and migration steps below

## Deployment notes

<!-- Anything ops/infra needs to know before or after merging. Delete if not applicable. -->

- [ ] No special deployment steps
- [ ] Requires env variable changes — list them:
- [ ] Requires database migration — migration name:
- [ ] Requires service restart / cache flush
- [ ] Must deploy in order (e.g. backend before frontend)

## Rollback plan

<!-- How to revert if this goes wrong in production. -->

- [ ] Safe to revert PR — no schema changes
- [ ] Requires manual rollback steps:

## Screenshots

<!-- For API changes: before/after response shape. For UI: before/after screenshots. Delete if not applicable. -->

## PR Assessment

| Dimension      | Rating                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Size**       | `XS` (<50 lines) / `S` (<200) / `M` (<500) / `L` (<1000) / `XL` (1000+)                                    |
| **Risk**       | `Low` — isolated change, well-tested / `Medium` — touches shared code / `High` — DB schema, auth, payments |
| **Confidence** | 🟢 High — fully tested, no edge cases / 🟡 Medium — some uncertainty / 🔴 Low — needs extra eyes           |

<!-- Fill in, e.g: Size: S | Risk: Low | Confidence: 🟢 High -->

## Checklist

- [ ] PR title follows Conventional Commits (`feat: ...`, `fix: ...`)
- [ ] New code has no `console.log` / debug artifacts
- [ ] Sensitive data not hardcoded or logged
- [ ] Related issues linked below

## Related issues

<!-- Closes #123 -->
<!-- Refs #456 -->
