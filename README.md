# DeliveryOS

> Delivery governance for Git hosting: structured sprints, QA review, and release control. **GitHub** and **GitLab** are fully supported by the shared CLI; see [`docs/PROVIDER_MATRIX.md`](docs/PROVIDER_MATRIX.md), [`docs/GITLAB.md`](docs/GITLAB.md), and [`docs/EXTENDING.md`](docs/EXTENDING.md) for other hosts.

[![Socket Badge](https://badge.socket.dev/npm/package/deliveryos)](https://socket.dev/npm/package/deliveryos)

---

## Why This Exists

Engineering teams often rely on informal coordination inside GitHub — manual approvals, inconsistent sprint tracking, reactive QA engagement, and socially enforced production releases.

As teams scale, this creates:

* Delivery ambiguity
* QA bottlenecks
* Unclear accountability
* Release risk
* Cross-team misalignment

**DeliveryOS** embeds structured intake, sprint orchestration, QA governance, and collaborative release gates directly into engineering repositories — without replacing CI/CD pipelines or disrupting developer workflows.

---

## Installation

**One command** (recommended):

```bash
npx deliveryos install --with-templates .
# GitLab (CI bundle + markdown issue templates):
npx deliveryos install --provider gitlab --with-templates .
```

From your repo root. Add `--with-labels` to create labels via `gh` (GitHub) or `glab` (GitLab). Use `--dry-run` to preview first.

**Alternative — clone and run script:**

```bash
git clone https://github.com/jkaweesi22/deliveryOS
cd deliveryOS

# New install or repo with existing workflows — adds only missing files (safe)
./scripts/install.sh --with-templates /path/to/your-repo

# GitLab
./scripts/install.sh --provider gitlab --with-templates /path/to/your-repo

# Also create labels via gh (GitHub) or glab (GitLab)
./scripts/install.sh --with-templates --with-labels /path/to/your-repo

# Update DeliveryOS (replace existing) — use --dry-run first to preview
./scripts/install.sh --with-templates --overwrite /path/to/your-repo
```

**Note:** By default, existing files are **never overwritten**. Use `--overwrite` only when updating DeliveryOS. See [Consumer Setup](docs/consumer-setup.md) for the full command guide.

**Other commands:**
```bash
npx deliveryos status .                    # Show what's installed
npx deliveryos uninstall .                    # Remove all installed assets (default)
npx deliveryos uninstall --provider github .   # GitHub workflows/templates only
npx deliveryos uninstall --provider gitlab --with-templates .  # GitLab CI bundle + templates
npx deliveryos uninstall --dry-run .           # Preview (no changes)
```

**Automation CLI** (after `npm run build` in-repo, or from a published package via `npx`): `issue-event`, `approval-event`, `notify`, `labels-ensure`, `release-check`. See [docs/MIGRATION.md](docs/MIGRATION.md) and [docs/PROVIDER_MATRIX.md](docs/PROVIDER_MATRIX.md).

**What gets installed:**

| Workflow | Purpose |
|----------|---------|
| `delivery-os-issues` | `issue-event` — sprint children, release approver ping, QA assignees, burn-down / auto-close |
| `delivery-os-approval` | `approval-event` — dual approval / decline on production issues |
| `delivery-os-notify` | `notify` — Telegram (issues, comments, PR merged to `main`) |
| `delivery-os-labels` | `labels-ensure` — create label catalog (manual dispatch) |

Also **`.github/actions/delivery-os-run`** (`npm ci` + `npm run build`). Workflows then call `node dist/main.js …`.

Workflows and templates are **copied** into your repo. No `workflow_call` to an external org.

---

## Quick Start (After Install)

1. **Create labels:** Actions → **DeliveryOS — Labels** → Run workflow
2. **Configure variables:** Settings → Secrets and variables → Actions → Variables
   - `RELEASE_APPROVER` — GitHub username
   - `QA_APPROVER` — GitHub username
   - `QA_ASSIGNEES` — Comma-separated usernames (e.g. `user1,user2`)
3. **Optional:** Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for alerts

---

## Sprint Child Creation

When you open an issue using the **Sprint Planning** template with a title like `SPRINT - Sprint 12`:

1. Each line under "Sprint Features (One Per Line)" becomes a child issue
2. Child issues link back with `Parent Sprint: #N`
3. Closing child issues updates burn-down; sprint auto-closes at 100%

**Required:** Install with `--with-templates` so the sprint form is available.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Landing page & quick start](https://jkaweesi22.github.io/deliveryOS/)** | Overview, one-command install, features |
| [PRFAQ](docs/PRFAQ.md) | Product overview and FAQs for all audiences (npm launch, install, governance) |
| [Press release (npm)](docs/press-release.md) | Formal announcement: DeliveryOS on npm |
| [Consumer Setup](docs/consumer-setup.md) | Installation, configuration, variables, labels, Telegram, uninstall |
| [How To](docs/how-to.md) | Create sprints, request releases, approve, report bugs, QA requests |
| [Architecture](docs/architecture.md) | Workflows, templates, data flow |
| [Migration (CLI)](docs/MIGRATION.md) | From inline Actions scripts to the shared CLI |
| [Provider matrix](docs/PROVIDER_MATRIX.md) | GitHub / GitLab first-class; stubs |
| [GitLab setup](docs/GITLAB.md) | Webhooks, tokens, Bearer, self-managed |
| [Extending providers](docs/EXTENDING.md) | Add Bitbucket, Codeberg, or others |
| [Platform CI](docs/platform-ci.md) | Variables parity across hosts |
| [Governance](docs/governance.md) | Lifecycle, approval gates, automation rules |

---

## License

MIT License. See [LICENSE](LICENSE) for details.
