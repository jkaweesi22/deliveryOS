# GitLab: DeliveryOS automation via webhook + trigger

1. Create a **Project Access Token** (or bot user PAT) with `api` scope. Store as masked CI variable `DELIVERY_OS_TOKEN`.
2. Add project **Webhooks** for **Issues events**, **Comments** (issue notes), and **Merge request events** (so `notify` can fire when an MR merges to your default branch — same rule as GitHub PR merged). Details: [docs/GITLAB.md](../../docs/GITLAB.md).
3. Webhook URL: a **trigger pipeline** URL that starts this project’s pipeline with a payload, or a small relay that writes `DELIVERY_OS_PAYLOAD_PATH` (see GitLab docs for [triggering pipelines](https://docs.gitlab.com/ee/ci/triggers/)).
4. In the triggered job, materialize JSON to a file and run:

```yaml
delivery-os-issue:
  stage: deploy
  image: node:20
  variables:
    DELIVERY_OS_PROVIDER: gitlab
  before_script:
    - npm ci --omit=dev || npm install --omit=dev
  script:
    - node dist/main.js issue-event
  rules:
    - if: '$CI_PIPELINE_SOURCE == "trigger"'
```

When developing **inside** this repository, use `npm ci && npm run build` instead of production `omit=dev` if TypeScript sources are not shipped.

Set `DELIVERY_OS_PROJECT_ID` from `CI_PROJECT_ID` automatically in GitLab CI.

For **issue comments** (approval flow), mirror the payload to the same pattern with:

```yaml
- node dist/main.js approval-event
```

And for Telegram:

```yaml
- node dist/main.js notify
```

(Requires `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.)

See [docs/MIGRATION.md](../../docs/MIGRATION.md), [docs/GITLAB.md](../../docs/GITLAB.md), [docs/EXTENDING.md](../../docs/EXTENDING.md), and [docs/PROVIDER_MATRIX.md](../../docs/PROVIDER_MATRIX.md).
