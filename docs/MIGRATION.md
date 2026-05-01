# Migration: inline GitHub Actions → Delivery OS CLI

## Summary

Legacy workflows embedded business logic in `actions/github-script`. These are replaced by four workflows that build the TypeScript CLI and invoke:

| Command           | Replaces (legacy workflow)        |
|-------------------|-----------------------------------|
| `issue-event`     | sprint-child-creator, notify-release-approver, auto-assign-qa, auto-close-sprint |
| `approval-event`  | authorize-deployment              |
| `notify`          | telegram-issues                   |
| `labels-ensure`   | setup-labels                      |

## Files removed

- `sprint-child-creator.yml`, `auto-close-sprint.yml`, `notify-release-approver.yml`, `authorize-deployment.yml`, `auto-assign-qa.yml`, `telegram-issues.yml`, `setup-labels.yml`

## New files

- `delivery-os-issues.yml`, `delivery-os-approval.yml`, `delivery-os-notify.yml`, `delivery-os-labels.yml`
- `.github/actions/delivery-os-run/action.yml` (composite: `npm ci` + `npm run build`)

## Consumer install

Run the installer again with `--overwrite` after upgrading the npm package so workflows and the composite action align:

```bash
npx github-delivery-os install --with-templates --overwrite .
```

Manually delete any leftover **old** workflow files if you had customized names.

## Environment variables (unchanged semantics)

| Variable | Use |
|----------|-----|
| `RELEASE_APPROVER` | Username for production approval |
| `QA_APPROVER` | Username for QA approval phrase |
| `QA_ASSIGNEES` | Comma-separated assignees for QA issues |
| `PROJECT_NAME` | Shown in release approver ping |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram (notify + sprint-complete) |
| `DELIVERY_OS_DRY_RUN` | `true` to log without writes |

## GitHub Actions payload

The CLI reads `GITHUB_EVENT_PATH` automatically. For other runners set `DELIVERY_OS_PAYLOAD` or `DELIVERY_OS_PAYLOAD_PATH`.

## GitLab

Set `DELIVERY_OS_PROVIDER=gitlab`, token, and project id; pass GitLab webhook JSON via payload path. See `examples/gitlab-ci/README.md`.
