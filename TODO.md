# TODO

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
