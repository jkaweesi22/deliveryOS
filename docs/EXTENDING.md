# Extending Delivery OS to another Git host

GitHub and GitLab are fully implemented. Other products reuse the same pipeline: **normalize webhooks → core handlers → `DeliveryProvider`**.

## 1. Implement `DeliveryProvider`

Define a class in `src/automation/providers/<name>/` that implements `DeliveryProvider` from `src/automation/providers/types.ts`:

- `listIssueComments`, `createComment`, `createIssue`, `updateIssue`, `addLabels`, `removeLabel`, `getIssue`, `listIssuesForBurnDown`, `setAssignees`, `ensureLabel`
- `readonly name` as a narrow string (e.g. `'bitbucket'`)

Follow `GitHubProvider.ts` and `GitLabProvider.ts` for pagination on `listIssuesForBurnDown` (`ISSUE_LIST_MAX_PAGES` × `ISSUE_LIST_PER_PAGE` from `src/automation/util/pagination.ts`), error handling, and id encodings expected by each API.

## 2. Map webhooks to unified payloads

Add `src/automation/normalize/<provider>.ts` that returns a `WebhookPayload` union from `src/automation/core/types.ts`:

- `issues` → `IssuesEventPayload` (`action`, normalized `issue`, `repository`, `sender`)
- `issue_comment` → `CommentEventPayload`
- `pull_request` → `PullRequestEventPayload` (for merge notifications and any PR-aware logic)

Register the normalizer in `src/automation/dispatch/parseWebhook.ts` (branch on `cfg.provider`).

Handlers are written against these shapes only; they must not import provider-specific SDKs.

## 3. Wire the factory and config

1. Add the provider to `ProviderName` in `src/automation/core/types.ts` and to allowed values in `src/automation/config/loadConfig.ts`.
2. In `src/automation/providers/factory.ts`, construct your provider when `config.provider` matches.
3. Extend `LoadedConfig` / `RuntimeConfig` only if the host needs extra flags (example: `gitlabUseBearer` for GitLab).

If the host sets standard env vars in CI, add inference in `loadConfig` (see `GITLAB_CI` / `GITHUB_ACTIONS`).

## 4. Replace stubs (optional package exports)

`BitbucketProviderStub` and `CodebergProviderStub` throw at runtime; replace them with real classes and update `docs/PROVIDER_MATRIX.md`.

## 5. Tests

- **Normalizer:** unit tests for each `object_kind` / event type you support (see `test/gitlabNormalize.test.ts`).
- **Provider:** mock `fetch` for a few methods and assert URLs, methods, and bodies (see `test/githubProvider.test.ts`, `test/gitlabProvider.test.ts`).
- **Integration:** optional contract tests against a fixture server.

## 6. Installer and docs

- If you ship templates (CI snippets), add them under `templates/` and teach `scripts/install.sh` / the npm installer about `--provider <name>`.
- Document tokens, webhook URLs, and env vars next to [GITLAB.md](GITLAB.md) and [consumer-setup.md](consumer-setup.md).

## Design rules

- Keep **all** host-specific I/O inside `providers/` and `normalize/`.
- Prefer **numeric / stable** issue ids for `NormalizedIssue.number` and API paths.
- When in doubt, mirror **GitHub’s** issue comment and label semantics so `approval-event` and sprint logic stay unchanged.
