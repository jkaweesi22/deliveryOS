# For immediate release

**DeliveryOS launches on npm**

Structured delivery governance for GitHub is now installable with a single command.

---

**March 30, 2026**

The **DeliveryOS** is now published on the npm registry as **`deliveryos`**. Engineering teams can add sprint planning, QA coordination, production release controls, and optional notifications to a repository without adopting a separate paid orchestration product.

DeliveryOS copies GitHub Actions workflows and issue templates directly into the consumer repository. Automation runs locally in that repo; there is no dependency on external workflow hosts beyond GitHub.

---

## Summary

| | |
|---|---|
| **Package** | [`deliveryos`](https://www.npmjs.com/package/deliveryos) on npm |
| **Documentation site** | [Project homepage](https://jkaweesi22.github.io/deliveryOS/) |
| **Source code** | [deliveryOS](https://github.com/jkaweesi22/deliveryOS) on GitHub |
| **License** | MIT |

---

## What the release provides

- **One-command installation** — `npx deliveryos install` with options for templates, labels, dry runs, and controlled overwrites when updating.
- **Consistent delivery patterns** — Sprint issues with structured feature lists, child issues, burn-down behavior, QA assignment, production release issues, and dual-approval gates (configurable via repository variables).
- **Transparency** — Workflows and templates live in `.github/` in your repository, so behavior is reviewable in version control.
- **Optional integrations** — Telegram notifications and GitHub CLI–based label setup where teams choose to enable them.

---

## Who it is for

Organizations that use **GitHub Issues** and **GitHub Actions** and want **repeatable** practices for sprints, QA handoffs, and production readiness—especially when the same model should apply across **multiple repositories** without manual copy-and-paste.

---

## Install

From the root of the target repository:

```bash
npx deliveryos install --with-templates .
```

See [Consumer Setup](consumer-setup.md) for flags, variables, and upgrade paths.

---

## Statement

> “Shipping DeliveryOS on npm lowers the barrier to adopting a clear delivery lifecycle. Teams get a documented install path, versioned releases, and the same workflows in the repo where their code already lives.”  
> — *GitHub Delivery Operating System maintainers*

---

## Availability

**`deliveryos`** is available on [npm](https://www.npmjs.com/package/deliveryos). Documentation, architecture, and governance details are in this repository and on the [project site](https://jkaweesi22.github.io/deliveryOS/).

---

## About the GitHub Delivery Operating System

The GitHub Delivery Operating System is an open-source framework that embeds delivery governance in GitHub using native Actions and issue templates. It is maintained in public on GitHub and released under the MIT License.

**Press and community:** Open an issue or discussion in the [repository](https://github.com/jkaweesi22/deliveryOS/issues) for technical questions or feedback.

---

*End of release*
