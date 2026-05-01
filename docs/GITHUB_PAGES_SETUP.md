# GitHub Pages setup (DeliveryOS)

Published site: **`https://jkaweesi22.github.io/deliveryOS/`**

The repo already includes [`.github/workflows/pages.yml`](../.github/workflows/pages.yml). It deploys the **`docs/`** folder (static `index.html`, `prfaq.html`, `site.css`, `site.js`) on every push to **`main`**.

---

## Step 1 — One-time: turn on Pages + Actions

1. Open the repo on GitHub: **https://github.com/jkaweesi22/deliveryOS**
2. Go to **Settings → Pages** (left sidebar).
3. Under **Build and deployment**:
   - **Source:** choose **GitHub Actions** (not “Deploy from a branch”).
4. Leave **Custom domain** empty unless you use your own domain later.
5. Click **Save** if the UI offers it.

**Note:** For a **private** repository, GitHub Pages on the free plan is limited; you may need **GitHub Pro/Team/Enterprise** or a **public** repo for `*.github.io` project sites. If the Pages UI blocks you, check [GitHub Docs: GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

---

## Step 2 — Confirm Actions are allowed

1. **Settings → Actions → General**
2. Under **Actions permissions**, use **Allow all actions and reusable workflows** (or your org’s equivalent).
3. Save.

---

## Step 3 — Run the deploy workflow

**Automatic:** Push to **`main`** (merge a PR or `git push`). The workflow **Deploy to GitHub Pages** runs.

**Manual:** **Actions** tab → **Deploy to GitHub Pages** → **Run workflow** → branch **main** → **Run workflow**.

---

## Step 4 — First run: environment (if GitHub asks)

Some repos show a banner: *“Waiting for approval”* for the **`github-pages`** environment.

1. Open the workflow run in **Actions**.
2. Approve the deployment if prompted, or go to **Settings → Environments → github-pages** and clear **Required reviewers** if you want fully automatic deploys.

---

## Step 5 — Check the live URL

1. After a green run, open **Settings → Pages** again — GitHub often shows **“Visit site”** with the real URL.
2. Or go directly to: **https://jkaweesi22.github.io/deliveryOS/**

The first deploy can take **1–3 minutes**. Hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) if you see a cache.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| 404 | Confirm **Source** is **GitHub Actions**, not an old branch/folder. Re-run the workflow. |
| Workflow fails on permissions | Ensure `pages.yml` has `permissions: pages: write` and `id-token: write` (it does). |
| Wrong repo name in URL | Project Pages URL is `https://<owner>.github.io/<repo>/` — must match the **exact** repo name (including case where the host cares). |
| CSS/JS missing | Asset links in `docs/*.html` are **relative** (`site.css`, `site.js`); avoid leading `/` unless you set a `<base href>`. |

---

## Alternative: deploy from the `docs` folder on `main` (no Actions workflow)

If you prefer not to use the workflow:

1. **Settings → Pages**
2. **Source:** **Deploy from a branch**
3. **Branch:** `main`, **folder** `/docs`
4. Save

You can remove or disable `pages.yml` to avoid double deploys. The Actions method is recommended here so deploys match CI and you avoid legacy Jekyll/Node warnings on some accounts.

---

## After npm publish

Point the npm package **homepage** in `package.json` at this site if you want the registry to link to it (optional):

```json
"homepage": "https://jkaweesi22.github.io/deliveryOS/"
```

Currently it points at the repo README; change only if you want the docs site as the primary link.
