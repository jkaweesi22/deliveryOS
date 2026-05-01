# Consumer example: use published npm package (no checkout of DeliveryOS)

Run from your repository root in GitHub Actions:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npx --yes deliveryos@1 issue-event
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Pin the `@` version to match your governance rollout.

Available commands: `issue-event`, `approval-event`, `notify`, `labels-ensure`, `release-check`.

For composite `uses: ./.github/actions/delivery-os-run` you need the action copied by `delivery-os install` or from this repo’s `.github/actions/delivery-os-run`.
