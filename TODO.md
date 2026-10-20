# TODO

> **Frozen (2026-10-07).** Do not add items. Open items are being triaged into Monday (bugs into bug
> tickets, follow-ups into the Follow-ups groups); this file is deleted once that is done.

Followups surfaced during the repo-hygiene audit in PR #277. None of these were in-scope for that PR; capture them here so they aren't lost.

## `packages/chat-ui` version is pinned at `0.0.0`

[packages/chat-ui/package.json](packages/chat-ui/package.json) declares `"version": "0.0.0"`. The four `chat-ui-publish-*.yml` workflows publish this subpackage to npm under dist-tags `dev` / `pr` / `latest` / `rc`, so the version field matters.

Decide:

- Is `0.0.0` intentional (the publish workflows compute a real version at publish time)? If so, document that.
- Or does it need a versioning strategy (semver bumps committed to source, or driven from git tags)?

## Deprecated `createAuthAdapter` export

[src/platform/auth/index.ts](src/platform/auth/index.ts) still re-exports `createAuthAdapter`, marked `@deprecated` in favour of `getAuthAdapter()`. Audit callers across the repo (and the `packages/chat-ui` subpackage), migrate them, and remove the export. Out of scope for a docs-hygiene PR — it's a code change with possible behaviour implications.

## 46 Dependabot alerts on `develop`

Surfaced by the push warning when PR #277 was pushed: **2 critical, 20 high, 18 moderate, 6 low**. Review at https://github.com/Smartspace-ai/Smartspace-app-public/security/dependabot and triage:

- Group runtime-affecting vs. dev-only vulnerabilities.
- Identify the handful of upgrades that clear most of the alert count.
- Open a dedicated security/upgrade PR — do **not** bundle into unrelated work.

## Extensible enums: followups from the SDK-values PR

`values[].type` is published as `x-extensible-enum` and the SDK's zod lets any string through. `mapMessageValuesDtoToModels` in chat-ui drops a value whose type the UI cannot place; the single `mapMessageValueDtoToModel` keeps its old contract (a cast) for existing callers.

- `spec-conformance.spec.ts`, case "messages: SSE delta output", still runs the single mapper while `streamThreadMessages` now sends deltas through the plural one. Mirror the service, or state why the single mapper is the thing under test there.
- `packages/chat-ui/src/domains/messages/schemas.ts` validates `values[].type` with `z.nativeEnum(MessageValueType)`. Nothing parses with that schema today; if something starts to, an unseen type throws. Either delete it or make it `z.string()` plus the drop rule.
- Smartspace-app `apps/admin/src/platform/chat/sandboxThreadStream.ts` maps delta outputs with the single mapper and forwards them unfiltered; move it to `mapMessageValuesDtoToModels` on its next chat-ui bump.
