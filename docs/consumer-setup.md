# Consumer Setup Guide

This guide explains how to install the Delivery Operating System into your repository. Workflows and templates are **copied directly** into your repo. No `workflow_call` or external references.

---

## ⚠️ Which Command to Use?

| Situation | Command | What happens |
|-----------|---------|--------------|
| **New repo** (no DeliveryOS yet) | `./scripts/install.sh --with-templates /path/to/repo` | Installs all workflows and templates |
| **Repo with existing workflows/templates** (yours + others) | `./scripts/install.sh --with-templates /path/to/repo` | Adds only *missing* DeliveryOS files. **Your existing files are NOT touched.** |
| **Update DeliveryOS** (get latest fixes) | `./scripts/install.sh --with-templates --overwrite /path/to/repo` | **Replaces** DeliveryOS workflows/templates. Your *other* workflows (different names) stay intact. |
| **Preview before installing** | `./scripts/install.sh --with-templates --dry-run /path/to/repo` | Shows what would be copied. No files changed. |

**Warning:** `--overwrite` replaces only DeliveryOS files (same names). It does **not** delete your other workflows or templates. Use `--dry-run` first if unsure.

---

## Installation

**One command (recommended):**

```bash
npx deliveryos install --with-templates .
```

From your repo root. Add `--with-labels` to create labels via **`gh`** (GitHub) or **`glab`** (GitLab) when those CLIs are installed and authenticated — see [Required Labels](#required-labels) below.

**Alternative — from the `deliveryOS` repo root:**

```bash
# Copy workflows only
./scripts/install.sh /path/to/your-repo

# Copy workflows + issue templates (required for sprint child creation)
./scripts/install.sh --with-templates /path/to/your-repo

# Copy workflows + templates + create labels via gh CLI
./scripts/install.sh --with-templates --with-labels /path/to/your-repo

# Update existing install (overwrite workflows and templates)
./scripts/install.sh --with-templates --overwrite /path/to/your-repo

# Preview what would happen (no files changed)
./scripts/install.sh --with-templates --dry-run /path/to/your-repo

# Explicitly skip existing (same as default)
./scripts/install.sh --no-overwrite /path/to/your-repo
```

**CLI options (with `npx deliveryos install`):**

| Flag | Description |
|------|-------------|
| `-t, --with-templates` | Copy issue templates |
| `-l, --with-labels` | Create labels via host CLI: **`gh`** (GitHub) or **`glab`** (GitLab); requires auth in that CLI |
| `-o, --overwrite` | Replace existing files |
| `-d, --dry-run` | Preview without changing files |

**Options:**

| Flag | Description |
|------|-------------|
| `--with-templates` | Copy issue templates (sprint, task, bug, QA, production release) |
| `--with-labels` | Create labels via **`gh label`** or **`glab label`** (see [Required Labels](#required-labels)) |
| `--overwrite` | Replace existing workflow/template files |
| `--no-overwrite` | Explicitly skip existing files (default behavior) |
| `--dry-run` | Show what would happen without changing any files |

By default, existing files are **skipped** (never overwritten). Use `--overwrite` to replace. Use `--dry-run` to preview changes safely.

---

## What Gets Installed

| Workflow | Purpose |
|----------|---------|
| `delivery-os-issues.yml` | Runs CLI `issue-event`: sprint children, release approver ping, QA assignees, burn-down / auto-close |
| `delivery-os-approval.yml` | Runs CLI `approval-event`: dual approval / decline on production issues |
| `delivery-os-notify.yml` | Runs CLI `notify`: Telegram alerts |
| `delivery-os-labels.yml` | Runs CLI `labels-ensure` (workflow_dispatch) |

Also copies **`.github/actions/delivery-os-run`** (composite: `npm ci` + `npm run build`). Automation logic lives in the npm package under `src/automation/` → `dist/main.js`. See [MIGRATION.md](MIGRATION.md).

---

## Sprint Child Creation

Child issues are created **automatically** when:

1. An issue is opened with a title containing `SPRINT -` (e.g. `SPRINT - Sprint 12`)
2. The issue body contains a section `### Sprint Features (One Per Line)` with one feature per line

**Required:** Use the `sprint_planning.yml` template (install with `--with-templates`). The template provides the correct form structure.

**Sprint dates:** Enter Sprint Start and Sprint End in YYYY-MM-DD format.

Each line under "Sprint Features" becomes a child issue with `Parent Sprint: #N` in the body.

---

## Configuration

### Repo Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Description |
|----------|-------------|
| `RELEASE_APPROVER` | GitHub username of release approver (for notify + authorize) |
| `QA_APPROVER` | GitHub username of QA approver (for dual approval) |
| `QA_ASSIGNEES` | Comma-separated usernames for QA auto-assignment (e.g. `user1,user2`) |
| `PROJECT_NAME` | Optional; shown in release approval notifications |

### Secrets (optional)

| Secret | Used By |
|--------|---------|
| `TELEGRAM_BOT_TOKEN` | `delivery-os-notify`, `delivery-os-issues` (sprint complete) |
| `TELEGRAM_CHAT_ID` | `delivery-os-notify`, `delivery-os-issues` (sprint complete) |

### Telegram Alerts

1. Create a bot via [@BotFather](https://t.me/BotFather); copy the token.
2. Start a chat with your bot or add it to a group/channel.
3. Get the chat ID: send a message, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `chat.id`.
4. Add both secrets in **Settings → Secrets and variables → Actions**.

Alerts are sent for: bugs, QA requests, sprints, production releases, PR merges to main. If secrets are not set, the workflow skips sending (no error).

---

## Required Labels

Labels must exist before governance automation behaves as designed. Use **one** of these approaches.

### GitHub

1. **After install (recommended):** **Actions → DeliveryOS — Labels** → **Run workflow**.  
   Uses `GITHUB_TOKEN` from the workflow — no extra CLI.
2. **During install:** `npx deliveryos install --with-templates --with-labels .`  
   Requires **`gh`** installed and `gh auth login`; uses the CLI token, not `GITHUB_TOKEN` in the shell.
3. **Manual / CI:** From a checkout with `npm ci && npm run build`, with repo identity in env:
   ```bash
   node dist/main.js labels-ensure
   ```
   Set **`GITHUB_TOKEN`** (or **`DELIVERY_OS_TOKEN`**) and **`GITHUB_REPOSITORY`** (or **`DELIVERY_OS_REPO`**) as for other automation jobs.

### GitLab

1. **During install:** `npx deliveryos install --provider gitlab --with-templates --with-labels .`  
   Requires **`glab`** and `glab auth login` for the target project.
2. **CI or shell:** Same `labels-ensure` command with **`GITLAB_TOKEN`** (or **`DELIVERY_OS_TOKEN`**) and **`CI_PROJECT_ID`** / **`DELIVERY_OS_PROJECT_ID`**, and **`GITLAB_CI`** or **`DELIVERY_OS_PROVIDER=gitlab`**.  
   Token needs **`api`** scope (project access token or PAT). Prefer a dedicated job or pipeline rather than reusing `CI_JOB_TOKEN` unless it has label permissions.
3. There is no GitLab equivalent of “Actions → Run workflow” unless you add a scheduled/manual pipeline that runs `labels-ensure`.

`labels-ensure` creates each catalog label via the REST API and ignores “already exists” responses — safe to re-run.

### Label catalog

| Label | Color |
|-------|-------|
| intake | 0E8A16 |
| bug | D93F0B |
| sprint | 1D76DB |
| sprint-active | 1D76DB |
| planning | 5319E7 |
| sprint-planning | 5319E7 |
| task | 7057FF |
| qa | FBCA04 |
| qa-request | FBCA04 |
| production | D93F0B |
| release | B60205 |
| approval | 0E8A16 |
| ready-for-deploy | 0E8A16 |
| declined | B60205 |
| risk | B60205 |

---

## Issue Templates (with `--with-templates`)

| Template | Purpose |
|----------|---------|
| `sprint_planning.yml` | Sprint planning; each feature line → child issue |
| `task.yml` | Structured task with priority, status, acceptance criteria |
| `qa_request.yml` | QA testing request |
| `production_release_qa_signoff.yml` | Production release + QA sign-off |
| `bug_report.yml` | Bug report with platform, severity, steps |

---

## Troubleshooting

### "Resource not accessible by integration" when creating issues

The consumer repo must allow workflows to write. In your consumer repo:

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Save

---

## Uninstalling

1. Delete these files from `.github/workflows/`:
   - `delivery-os-issues.yml`
   - `delivery-os-approval.yml`
   - `delivery-os-notify.yml`
   - `delivery-os-labels.yml`
2. Remove `.github/actions/delivery-os-run/action.yml` (and empty `actions` folders if desired).

Or run `npx deliveryos uninstall .` (see CLI help for `--provider`).

3. Optionally remove templates from `.github/ISSUE_TEMPLATE/` and repo variables/secrets.
