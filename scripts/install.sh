#!/usr/bin/env bash
# Delivery Operating System — Installer (GitHub Actions or GitLab CI bundle)
# Default: skip existing files. Use --overwrite to replace.

set -e

usage() {
  echo "Usage: $0 [options] [target_dir]"
  echo ""
  echo "Options:"
  echo "  --provider <github|gitlab>  Host target (default: github)"
  echo "  --with-templates            Copy issue templates"
  echo "  --with-labels               Create labels via gh (GitHub) or glab (GitLab)"
  echo "  --overwrite                 Replace existing workflows / CI bundle / templates"
  echo "  --no-overwrite              Skip existing files (default)"
  echo "  --dry-run                   Show what would happen without changing files"
  echo "  -h, --help                  Show this help"
  echo ""
  echo "Default: existing matching files are NOT overwritten. Use --overwrite to replace."
}

TARGET_DIR="."
PROVIDER="github"
WITH_TEMPLATES=false
WITH_LABELS=false
OVERWRITE=false
DRY_RUN=false

while [ $# -gt 0 ]; do
  case "$1" in
    --provider)
      PROVIDER="${2:-}"
      shift 2
      ;;
    --with-templates) WITH_TEMPLATES=true; shift ;;
    --with-labels) WITH_LABELS=true; shift ;;
    --overwrite) OVERWRITE=true; shift ;;
    --no-overwrite) OVERWRITE=false; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) TARGET_DIR="$1"; shift ;;
  esac
done

PROVIDER="$(echo "$PROVIDER" | tr '[:upper:]' '[:lower:]')"
if [ "$PROVIDER" != "github" ] && [ "$PROVIDER" != "gitlab" ]; then
  echo "Unknown --provider: use github or gitlab"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_ABS="$(cd "$TARGET_DIR" && pwd)"

WORKFLOWS_SRC="${REPO_ROOT}/.github/workflows"
GH_TEMPLATES_SRC="${REPO_ROOT}/.github/ISSUE_TEMPLATE"
GL_CI_SRC="${REPO_ROOT}/templates/gitlab/.gitlab-ci.yml"
GL_TEMPLATES_SRC="${REPO_ROOT}/templates/gitlab/issue_templates"

echo "=== Delivery Operating System ==="
echo "Provider: ${PROVIDER}"
echo "Target: ${TARGET_ABS}"
if [ "$OVERWRITE" = "true" ]; then
  echo ""
  echo "⚠️  WARNING: Overwrite mode — existing Delivery OS assets will be REPLACED."
  echo ""
elif [ "$DRY_RUN" = "true" ]; then
  echo "Mode: dry-run (no files will be changed)"
  echo ""
else
  echo "Mode: skip-existing (existing matching files will NOT be overwritten)"
  echo ""
fi

WORKFLOWS_COPIED=0
TEMPLATES_COPIED=0
CI_COPIED=0
LABELS_CREATED=0
LABELS_SKIP_REASON=""

install_github() {
  mkdir -p "${TARGET_ABS}/.github/workflows"
  mkdir -p "${TARGET_ABS}/.github/ISSUE_TEMPLATE"

  WORKFLOWS=(delivery-os-issues delivery-os-approval delivery-os-notify delivery-os-labels)
  ACTION_SRC="${REPO_ROOT}/.github/actions/delivery-os-run/action.yml"
  ACTION_DEST="${TARGET_ABS}/.github/actions/delivery-os-run/action.yml"
  if [ -f "$ACTION_SRC" ]; then
    if [ -f "$ACTION_DEST" ] && [ "$OVERWRITE" != "true" ]; then
      echo "  Skipped (exists): .github/actions/delivery-os-run/action.yml"
    elif [ "$DRY_RUN" = "true" ]; then
      echo "  [dry-run] Would create: .github/actions/delivery-os-run/action.yml"
      WORKFLOWS_COPIED=$((WORKFLOWS_COPIED + 1))
    else
      mkdir -p "${TARGET_ABS}/.github/actions/delivery-os-run"
      cp "$ACTION_SRC" "$ACTION_DEST"
      echo "  Created: .github/actions/delivery-os-run/action.yml"
      WORKFLOWS_COPIED=$((WORKFLOWS_COPIED + 1))
    fi
  fi

  for wf in "${WORKFLOWS[@]}"; do
    src="${WORKFLOWS_SRC}/${wf}.yml"
    dest="${TARGET_ABS}/.github/workflows/${wf}.yml"
    if [ ! -f "$src" ]; then
      echo "  Warning: source not found: ${wf}.yml"
      continue
    fi
    if [ -f "$dest" ] && [ "$OVERWRITE" != "true" ]; then
      echo "  Skipped (exists): ${wf}.yml"
    elif [ "$DRY_RUN" = "true" ]; then
      echo "  [dry-run] Would create: ${wf}.yml"
      WORKFLOWS_COPIED=$((WORKFLOWS_COPIED + 1))
    else
      cp "$src" "$dest"
      echo "  Created: ${wf}.yml"
      WORKFLOWS_COPIED=$((WORKFLOWS_COPIED + 1))
    fi
  done

  if [ "$WITH_TEMPLATES" = true ] && [ -d "$GH_TEMPLATES_SRC" ]; then
    for tpl in "$GH_TEMPLATES_SRC"/*.yml; do
      [ -f "$tpl" ] || continue
      name=$(basename "$tpl")
      dest="${TARGET_ABS}/.github/ISSUE_TEMPLATE/${name}"
      if [ -f "$dest" ] && [ "$OVERWRITE" != "true" ]; then
        echo "  Skipped (exists): ${name}"
      elif [ "$DRY_RUN" = "true" ]; then
        echo "  [dry-run] Would create template: ${name}"
        TEMPLATES_COPIED=$((TEMPLATES_COPIED + 1))
      else
        cp "$tpl" "$dest"
        echo "  Created template: ${name}"
        TEMPLATES_COPIED=$((TEMPLATES_COPIED + 1))
      fi
    done
  fi
}

install_gitlab() {
  if [ ! -f "$GL_CI_SRC" ]; then
    echo "  Error: missing templates/gitlab/.gitlab-ci.yml"
    return
  fi
  dest="${TARGET_ABS}/.gitlab-ci.yml"
  if [ -f "$dest" ] && [ "$OVERWRITE" != "true" ]; then
    echo "  Skipped (exists): .gitlab-ci.yml"
  elif [ "$DRY_RUN" = "true" ]; then
    echo "  [dry-run] Would create: .gitlab-ci.yml"
    CI_COPIED=$((CI_COPIED + 1))
  else
    cp "$GL_CI_SRC" "$dest"
    echo "  Created: .gitlab-ci.yml"
    CI_COPIED=$((CI_COPIED + 1))
  fi

  if [ "$WITH_TEMPLATES" = true ] && [ -d "$GL_TEMPLATES_SRC" ]; then
    mkdir -p "${TARGET_ABS}/.gitlab/issue_templates"
    for tpl in "$GL_TEMPLATES_SRC"/*.md; do
      [ -f "$tpl" ] || continue
      name=$(basename "$tpl")
      dest="${TARGET_ABS}/.gitlab/issue_templates/${name}"
      if [ -f "$dest" ] && [ "$OVERWRITE" != "true" ]; then
        echo "  Skipped (exists): .gitlab/issue_templates/${name}"
      elif [ "$DRY_RUN" = "true" ]; then
        echo "  [dry-run] Would create: .gitlab/issue_templates/${name}"
        TEMPLATES_COPIED=$((TEMPLATES_COPIED + 1))
      else
        cp "$tpl" "$dest"
        echo "  Created: .gitlab/issue_templates/${name}"
        TEMPLATES_COPIED=$((TEMPLATES_COPIED + 1))
      fi
    done
  fi
}

labels_github() {
  if [ "$WITH_LABELS" != true ]; then return; fi
  if [ "$DRY_RUN" = "true" ]; then
    LABELS_SKIP_REASON="Skipped in dry-run."
    echo "  [dry-run] Labels would be created via gh (skipped)"
    return
  fi
  if ! command -v gh &>/dev/null; then
    LABELS_SKIP_REASON="gh CLI not installed. Install from https://cli.github.com/"
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  if [ ! -d "${TARGET_ABS}/.git" ]; then
    LABELS_SKIP_REASON="Target is not a git repository."
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  if ! (cd "$TARGET_ABS" && gh auth status &>/dev/null); then
    LABELS_SKIP_REASON="gh CLI not authenticated. Run: gh auth login"
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  if ! (cd "$TARGET_ABS" && gh repo view &>/dev/null); then
    LABELS_SKIP_REASON="Target repo not on GitHub or no API access."
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  LABELS=(
    "intake:0E8A16"
    "bug:D93F0B"
    "sprint:1D76DB"
    "sprint-active:1D76DB"
    "planning:5319E7"
    "sprint-planning:5319E7"
    "task:7057FF"
    "qa:FBCA04"
    "qa-request:FBCA04"
    "production:D93F0B"
    "release:B60205"
    "approval:0E8A16"
    "ready-for-deploy:0E8A16"
    "declined:B60205"
    "risk:B60205"
  )
  for entry in "${LABELS[@]}"; do
    name="${entry%%:*}"
    color="${entry##*:}"
    set +e
    err=$(cd "$TARGET_ABS" && gh label create "$name" --color "$color" 2>&1)
    code=$?
    set -e
    if [ $code -eq 0 ]; then
      echo "  Created label: $name"
      LABELS_CREATED=$((LABELS_CREATED + 1))
    elif echo "$err" | grep -qi "already exists"; then
      echo "  Skipped (exists): $name"
    else
      echo "  Failed to create label '$name': $err"
    fi
  done
}

labels_gitlab() {
  if [ "$WITH_LABELS" != true ]; then return; fi
  if [ "$DRY_RUN" = "true" ]; then
    LABELS_SKIP_REASON="Skipped in dry-run."
    echo "  [dry-run] Labels would be created via glab (skipped)"
    return
  fi
  if ! command -v glab &>/dev/null; then
    LABELS_SKIP_REASON="glab not installed. See https://gitlab.com/gitlab-org/cli/"
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  if [ ! -d "${TARGET_ABS}/.git" ]; then
    LABELS_SKIP_REASON="Target is not a git repository."
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  if ! (cd "$TARGET_ABS" && glab auth status &>/dev/null); then
    LABELS_SKIP_REASON="glab not authenticated. Run: glab auth login"
    echo "  Skipped labels: $LABELS_SKIP_REASON"
    return
  fi
  LABELS=(
    "intake:0E8A16"
    "bug:D93F0B"
    "sprint:1D76DB"
    "sprint-active:1D76DB"
    "planning:5319E7"
    "sprint-planning:5319E7"
    "task:7057FF"
    "qa:FBCA04"
    "qa-request:FBCA04"
    "production:D93F0B"
    "release:B60205"
    "approval:0E8A16"
    "ready-for-deploy:0E8A16"
    "declined:B60205"
    "risk:B60205"
  )
  for entry in "${LABELS[@]}"; do
    name="${entry%%:*}"
    color="${entry##*:}"
    set +e
    err=$(cd "$TARGET_ABS" && glab label create "$name" --color "$color" 2>&1)
    code=$?
    set -e
    if [ $code -eq 0 ]; then
      echo "  Created label: $name"
      LABELS_CREATED=$((LABELS_CREATED + 1))
    elif echo "$err" | grep -qiE "already|taken"; then
      echo "  Skipped (exists): $name"
    else
      echo "  Failed to create label '$name': $err"
    fi
  done
}

if [ "$PROVIDER" = "github" ]; then
  install_github
  labels_github
else
  install_gitlab
  labels_gitlab
fi

echo ""
if [ $WORKFLOWS_COPIED -gt 0 ] || [ $TEMPLATES_COPIED -gt 0 ] || [ $LABELS_CREATED -gt 0 ] || [ $CI_COPIED -gt 0 ]; then
  if [ "$DRY_RUN" = "true" ]; then
    [ $WORKFLOWS_COPIED -gt 0 ] && echo "Would install ${WORKFLOWS_COPIED} GitHub workflow(s)."
    [ $CI_COPIED -gt 0 ] && echo "Would install GitLab CI bundle."
    [ $TEMPLATES_COPIED -gt 0 ] && echo "Would copy ${TEMPLATES_COPIED} template(s)."
  else
    [ $WORKFLOWS_COPIED -gt 0 ] && echo "Installed ${WORKFLOWS_COPIED} GitHub workflow(s)."
    [ $CI_COPIED -gt 0 ] && echo "Installed GitLab CI bundle (.gitlab-ci.yml)."
    [ $TEMPLATES_COPIED -gt 0 ] && echo "Copied ${TEMPLATES_COPIED} template(s)."
    [ $LABELS_CREATED -gt 0 ] && echo "Created ${LABELS_CREATED} label(s)."
  fi
  echo ""
  echo "Next steps:"
  if [ "$PROVIDER" = "github" ]; then
    echo "  1. Actions → Delivery OS — Labels → Run workflow (if not using --with-labels)"
    [ -n "$LABELS_SKIP_REASON" ] && echo "     (Labels skipped: $LABELS_SKIP_REASON)"
    echo "  2. Settings → Secrets and variables → Actions: RELEASE_APPROVER, QA_APPROVER, QA_ASSIGNEES"
    echo "  3. Optional secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
    [ "$WITH_TEMPLATES" = false ] && echo "  4. Re-run with --with-templates for issue forms"
  else
    echo "  1. Settings → CI/CD → Variables: RELEASE_APPROVER, QA_APPROVER, QA_ASSIGNEES"
    [ -n "$LABELS_SKIP_REASON" ] && echo "     (Labels skipped: $LABELS_SKIP_REASON)"
    echo "  2. Optional secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
    echo "  3. Push default branch to publish Pages from docs/"
    [ "$WITH_TEMPLATES" = false ] && echo "  4. Re-run with --with-templates for .gitlab/issue_templates"
  fi
  echo ""
  echo "See docs/platform-ci.md for cross-platform notes."
else
  if [ "$DRY_RUN" = "true" ]; then
    echo "Dry run complete. No files were changed."
  else
    echo "No new files created (existing files were skipped)."
    echo "To update: use --overwrite (use --dry-run first to preview)."
  fi
fi
echo ""
echo "=== Installation complete ==="
