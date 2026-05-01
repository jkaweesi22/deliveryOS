# Provider matrix

| Capability | GitHub | GitLab | Bitbucket | Codeberg |
|------------|--------|--------|-----------|----------|
| `issue-event` (sprint, QA assign, release ping, burn-down) | Yes (`issues` webhook) | Yes (Issue Hook; `update` with label changes → `labeled`) | Stub | Stub |
| `approval-event` | Yes (`issue_comment`) | Yes (Note on Issue) | Stub | Stub |
| `notify` (Telegram) | Yes (issues, comments, PR merged) | Yes (issues, notes, MR **merge** → same as PR merged) | Stub | Stub |
| `labels-ensure` | Yes | Yes | Stub | Stub |
| Pages / release | Actions | GitLab CI template | — | — |

**Tokens**

- **GitHub:** `GITHUB_TOKEN` in Actions, or PAT with `repo` / Issues scope.
- **GitLab:** Project access token or PAT with `api`; see [GITLAB.md](GITLAB.md). Optional `DELIVERY_OS_GITLAB_USE_BEARER=1` for OAuth-style bearer tokens.

**Burn-down listing**

- Both GitHub and GitLab enumerate up to **`ISSUE_LIST_MAX_PAGES` × `ISSUE_LIST_PER_PAGE`** issues (currently 10 × 100). Adjust `src/automation/util/pagination.ts` if you need a higher cap.

**Extend to another host**

- Implement `DeliveryProvider`, add a normalizer, register in `parseWebhook` and `createProvider`. Step-by-step: [EXTENDING.md](EXTENDING.md).
