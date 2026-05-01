# Platform CI: GitHub Actions and GitLab CI

Delivery OS is **host-agnostic in principle**: governance labels, issue templates, and CI variables use the same *meaning* across hosts. **Automation** is implemented where each platform supports it today.

Shared **Node CLI** commands (`issue-event`, `approval-event`, `notify`, `labels-ensure`) live in the published package (`dist/main.js`); GitHub workflows in this repo run `npm run build` then `node dist/main.js …`. See [MIGRATION.md](MIGRATION.md) and [PROVIDER_MATRIX.md](PROVIDER_MATRIX.md).

## What maps cleanly

| Capability | GitHub | GitLab |
|------------|--------|--------|
| Docs site from `docs/` | Actions (`pages.yml`) | `pages` job in `.gitlab-ci.yml` bundle |
| Release on `v*` tag | `release.yml` | `release_job` in GitLab template |
| CI variables (approvers, QA, Telegram) | Actions variables / secrets | CI/CD variables (masked secrets where needed) |
| Issue templates | YAML issue forms | Markdown + quick actions in `.gitlab/issue_templates/` |
| Labels | `delivery-os-labels` / `delivery-os labels-ensure`, `gh label`, install `--with-labels` | `glab label` or install `--with-labels` with `--provider gitlab` |

## Canonical variable names

Use the same names on both platforms so runbooks and templates stay portable:

| Variable | Purpose |
|----------|---------|
| `RELEASE_APPROVER` | Username for production release approval |
| `QA_APPROVER` | QA approver username |
| `QA_ASSIGNEES` | Comma-separated usernames for QA assignment |
| `TELEGRAM_BOT_TOKEN` | Optional Telegram bot token (secret) |
| `TELEGRAM_CHAT_ID` | Optional chat id (secret or variable) |

On GitHub these are Actions **Variables** / **Secrets**. On GitLab: **Settings → CI/CD → Variables**.

## Issue-driven workflows (sprint children, approvals, auto-close, etc.)

GitHub Actions subscribes to **issues**, **issue_comment**, and **pull_request** natively. On GitLab, use **project webhooks** (Issues, Comments, Merge requests) to invoke a job, script, or external runner that executes the same CLI with the webhook JSON as `DELIVERY_OS_PAYLOAD` / `DELIVERY_OS_PAYLOAD_PATH`. See [GITLAB.md](GITLAB.md) for the event list, token scopes, `CI_API_V4_URL`, and optional `DELIVERY_OS_GITLAB_USE_BEARER`.

The `templates/gitlab/.gitlab-ci.yml` bundle ships **Pages + Release** plus documentation; wire webhooks separately for full governance automation on self-managed or GitLab.com.

## Installer

```bash
# GitHub (default): `.github/workflows` + optional Issue Form templates
npx github-delivery-os install --with-templates .

# GitLab: root `.gitlab-ci.yml` + `.gitlab/issue_templates/*.md` (Pages/Release baseline)
npx github-delivery-os install --provider gitlab --with-templates .
# Full issue automation: run the same CLI with GitLab webhooks — see examples/gitlab-ci/README.md.
```

Labels: `--with-labels` uses **GitHub CLI** (`gh`) for `--provider github` and **GitLab CLI** (`glab`) for `--provider gitlab` when available.

## Future: shared automation core

A shared Node CLI under `src/automation/` implements **GitHub REST** and **GitLab REST** (`/api/v4`) with a common `DeliveryProvider`. To add **Bitbucket**, **Codeberg**, or another host, follow [EXTENDING.md](EXTENDING.md).
