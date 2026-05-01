# GitLab: webhooks, API, and parity with GitHub

Delivery OS treats GitLab as a **first-class** host: the same CLI (`issue-event`, `approval-event`, `notify`, `labels-ensure`, `release-check`) and the same `DeliveryProvider` surface as GitHub, with GitLab-specific normalization in `src/automation/normalize/gitlab.ts`.

## Webhooks to enable

In your GitLab project: **Settings → Webhooks**, point at the job or bridge that runs the Delivery OS CLI with the JSON body.

| GitLab hook | Used for |
|-------------|----------|
| **Issues events** | Sprint automation, QA assignees, release pings, burn-down, auto-close |
| **Comments** (issue notes) | Dual approval / decline (`approval-event`) |
| **Merge request events** | Telegram “PR merged” when `action` is **merge** (mapped to `pull_request` internally) |

For `notify`, ensure the pipeline receives the same payload GitLab posts (e.g. write `GH-style` env is not required; use `DELIVERY_OS_PAYLOAD` / file path as in [MIGRATION.md](MIGRATION.md)).

## Token and API URL

- **Token:** `DELIVERY_OS_TOKEN` or `GITLAB_TOKEN`. Prefer a **project access token** or personal access token with **`api`** scope. `CI_JOB_TOKEN` is usually **not** enough for creating/updating issues and labels across the project API.
- **API base:** GitLab sets `CI_API_V4_URL` in CI. You can override with `DELIVERY_OS_API_URL` (must be the **v4** REST root, e.g. `https://gitlab.example.com/api/v4`).
- **Project id:** `DELIVERY_OS_PROJECT_ID` or `CI_PROJECT_ID` (numeric id or URL-encoded path).

## Bearer vs Private-Token

By default the GitLab provider sends `PRIVATE-TOKEN: <token>`, which matches personal and project access tokens.

If your token only works as an OAuth bearer (or your runner injects such a token), set:

```bash
DELIVERY_OS_GITLAB_USE_BEARER=1
```

The provider will then use `Authorization: Bearer <token>` instead.

## Default branch and Telegram

`DELIVERY_OS_DEFAULT_BRANCH`, `DEFAULT_BRANCH`, or `CI_DEFAULT_BRANCH` configure which target branch counts as “merged to main” for Telegram. This matches GitHub behavior for `pull_request` / GitLab MR-merge events.

## Self-managed GitLab

1. Set `DELIVERY_OS_API_URL` to your instance’s `https://host/api/v4`.
2. Optionally set `DELIVERY_OS_WEB_URL` if issue/MR URLs in webhooks need a explicit public base (normalization also uses `project.web_url` when present).
3. Use the same webhook checklist as on GitLab.com.

## Where the code lives

- **HTTP:** `src/automation/providers/gitlab/GitLabProvider.ts` (pagination for burn-down, labels, notes, issues).
- **Webhooks:** `src/automation/normalize/gitlab.ts` (issues, notes, merge_request → `pull_request`).
- **Project id hydration:** `src/automation/normalize/gitlabProject.ts`, `src/automation/config/hydrate.ts`.

For adding **Bitbucket, Codeberg, or another host**, see [EXTENDING.md](EXTENDING.md).
