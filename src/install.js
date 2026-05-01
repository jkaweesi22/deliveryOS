const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const PROVIDERS = ['github', 'gitlab'];

const WORKFLOWS = [
  'delivery-os-issues',
  'delivery-os-approval',
  'delivery-os-notify',
  'delivery-os-labels',
];

const LABELS = [
  ['intake', '0E8A16'],
  ['bug', 'D93F0B'],
  ['sprint', '1D76DB'],
  ['sprint-active', '1D76DB'],
  ['planning', '5319E7'],
  ['sprint-planning', '5319E7'],
  ['task', '7057FF'],
  ['qa', 'FBCA04'],
  ['qa-request', 'FBCA04'],
  ['production', 'D93F0B'],
  ['release', 'B60205'],
  ['approval', '0E8A16'],
  ['ready-for-deploy', '0E8A16'],
  ['declined', 'B60205'],
  ['risk', 'B60205'],
];

const GITLAB_BUNDLE_MARKER = 'delivery-operating-system-bundle';

const GITLAB_ISSUE_TEMPLATES = [
  'Task.md',
  'Sprint_planning.md',
  'QA_request.md',
  'Bug_report.md',
  'Production_release.md',
];

const TEMPLATES = [
  'config.yml',
  'sprint_planning.yml',
  'task.yml',
  'qa_request.yml',
  'production_release_qa_signoff.yml',
  'bug_report.yml',
];

function getPackageRoot() {
  const possibleRoots = [
    path.join(__dirname, '..'),
    path.join(__dirname, '..', '..', '..'),
  ];
  for (const root of possibleRoots) {
    const ghWorkflow = path.join(root, '.github', 'workflows', 'delivery-os-issues.yml');
    const glBundle = path.join(root, 'templates', 'gitlab', '.gitlab-ci.yml');
    if (fs.existsSync(ghWorkflow) || fs.existsSync(glBundle)) {
      return root;
    }
  }
  throw new Error('Could not find package assets. Ensure published package includes .github/workflows or templates/gitlab/.gitlab-ci.yml.');
}

function isGitlabBundleFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const text = fs.readFileSync(filePath, 'utf8');
  return text.includes(GITLAB_BUNDLE_MARKER);
}

function runInstall(options) {
  const {
    targetDir = '.',
    provider = 'github',
    withTemplates = false,
    withLabels = false,
    overwrite = false,
    dryRun = false,
  } = options;

  const p = String(provider || 'github').toLowerCase();
  if (!PROVIDERS.includes(p)) {
    throw new Error(`Unknown provider "${provider}". Use: ${PROVIDERS.join(', ')}`);
  }

  const pkgRoot = getPackageRoot();
  const targetAbs = path.resolve(process.cwd(), targetDir);

  console.log('=== Delivery Operating System ===');
  console.log(`Provider: ${p}`);
  console.log(`Target: ${targetAbs}`);

  if (overwrite) {
    console.log('');
    console.log('⚠️  WARNING: Overwrite mode — existing DeliveryOS assets will be REPLACED.');
    console.log('    (Other files in .github/ or .gitlab/ with different names are not affected.)');
    console.log('');
  } else if (dryRun) {
    console.log('Mode: dry-run (no files will be changed)');
    console.log('');
  } else {
    console.log('Mode: skip-existing (existing matching files will NOT be overwritten)');
    console.log('');
  }

  if (p === 'github') {
    installGithub({
      pkgRoot,
      targetAbs,
      withTemplates,
      withLabels,
      overwrite,
      dryRun,
    });
  } else {
    installGitlab({
      pkgRoot,
      targetAbs,
      withTemplates,
      withLabels,
      overwrite,
      dryRun,
    });
  }

  console.log('');
  console.log('=== Installation complete ===');
}

function installGithub({ pkgRoot, targetAbs, withTemplates, withLabels, overwrite, dryRun }) {
  const workflowsSrc = path.join(pkgRoot, '.github', 'workflows');
  const templatesSrc = path.join(pkgRoot, '.github', 'ISSUE_TEMPLATE');
  const workflowsDest = path.join(targetAbs, '.github', 'workflows');
  const templatesDest = path.join(targetAbs, '.github', 'ISSUE_TEMPLATE');

  if (!dryRun) {
    fs.mkdirSync(workflowsDest, { recursive: true });
    fs.mkdirSync(templatesDest, { recursive: true });
  }

  let workflowsCopied = 0;
  let templatesCopied = 0;
  let actionCopied = 0;

  const actionSrc = path.join(pkgRoot, '.github', 'actions', 'delivery-os-run', 'action.yml');
  const actionDestDir = path.join(targetAbs, '.github', 'actions', 'delivery-os-run');
  const actionDest = path.join(actionDestDir, 'action.yml');
  if (fs.existsSync(actionSrc)) {
    if (fs.existsSync(actionDest) && !overwrite) {
      console.log('  Skipped (exists): .github/actions/delivery-os-run/action.yml');
    } else if (dryRun) {
      console.log('  [dry-run] Would create: .github/actions/delivery-os-run/action.yml');
      actionCopied++;
    } else {
      fs.mkdirSync(actionDestDir, { recursive: true });
      fs.copyFileSync(actionSrc, actionDest);
      console.log('  Created: .github/actions/delivery-os-run/action.yml');
      actionCopied++;
    }
  }

  for (const wf of WORKFLOWS) {
    const src = path.join(workflowsSrc, `${wf}.yml`);
    const dest = path.join(workflowsDest, `${wf}.yml`);

    if (!fs.existsSync(src)) {
      console.log(`  Warning: source not found: ${wf}.yml`);
      continue;
    }

    if (fs.existsSync(dest) && !overwrite) {
      console.log(`  Skipped (exists): ${wf}.yml`);
    } else if (dryRun) {
      console.log(`  [dry-run] Would create: ${wf}.yml`);
      workflowsCopied++;
    } else {
      fs.copyFileSync(src, dest);
      console.log(`  Created: ${wf}.yml`);
      workflowsCopied++;
    }
  }

  if (withTemplates && fs.existsSync(templatesSrc)) {
    const files = fs.readdirSync(templatesSrc);
    for (const name of files) {
      if (!name.endsWith('.yml') && !name.endsWith('.yaml')) continue;
      const src = path.join(templatesSrc, name);
      const dest = path.join(templatesDest, name);
      if (!fs.statSync(src).isFile()) continue;

      if (fs.existsSync(dest) && !overwrite) {
        console.log(`  Skipped (exists): ${name}`);
      } else if (dryRun) {
        console.log(`  [dry-run] Would create template: ${name}`);
        templatesCopied++;
      } else {
        fs.copyFileSync(src, dest);
        console.log(`  Created template: ${name}`);
        templatesCopied++;
      }
    }
  }

  const { labelsCreated, labelsSkipReason } = runLabelsGithub({
    targetAbs,
    withLabels,
    dryRun,
  });

  printGithubNextSteps({
    dryRun,
    withTemplates,
    workflowsCopied,
    actionCopied,
    templatesCopied,
    labelsCreated,
    labelsSkipReason,
  });
}

function installGitlab({ pkgRoot, targetAbs, withLabels, withTemplates, overwrite, dryRun }) {
  const ciSrc = path.join(pkgRoot, 'templates', 'gitlab', '.gitlab-ci.yml');
  const glTemplatesSrc = path.join(pkgRoot, 'templates', 'gitlab', 'issue_templates');
  const ciDest = path.join(targetAbs, '.gitlab-ci.yml');
  const issueTplDest = path.join(targetAbs, '.gitlab', 'issue_templates');

  if (!fs.existsSync(ciSrc)) {
    console.log(`  Error: missing ${path.relative(pkgRoot, ciSrc)} in package.`);
    return;
  }

  let ciCopied = 0;
  let templatesCopied = 0;

  if (fs.existsSync(ciDest) && !overwrite) {
    console.log('  Skipped (exists): .gitlab-ci.yml');
  } else if (dryRun) {
    console.log('  [dry-run] Would create: .gitlab-ci.yml');
    ciCopied++;
  } else {
    fs.copyFileSync(ciSrc, ciDest);
    console.log('  Created: .gitlab-ci.yml');
    ciCopied++;
  }

  if (withTemplates && fs.existsSync(glTemplatesSrc)) {
    if (!dryRun) {
      fs.mkdirSync(issueTplDest, { recursive: true });
    }
    for (const name of GITLAB_ISSUE_TEMPLATES) {
      const src = path.join(glTemplatesSrc, name);
      if (!fs.existsSync(src)) continue;
      const dest = path.join(issueTplDest, name);
      if (fs.existsSync(dest) && !overwrite) {
        console.log(`  Skipped (exists): .gitlab/issue_templates/${name}`);
      } else if (dryRun) {
        console.log(`  [dry-run] Would create: .gitlab/issue_templates/${name}`);
        templatesCopied++;
      } else {
        fs.copyFileSync(src, dest);
        console.log(`  Created: .gitlab/issue_templates/${name}`);
        templatesCopied++;
      }
    }
  }

  const { labelsCreated, labelsSkipReason } = runLabelsGitlab({
    targetAbs,
    withLabels,
    dryRun,
  });

  printGitlabNextSteps({
    dryRun,
    withTemplates,
    ciCopied,
    templatesCopied,
    labelsCreated,
    labelsSkipReason,
  });
}

function runLabelsGithub({ targetAbs, withLabels, dryRun }) {
  let labelsCreated = 0;
  let labelsSkipReason = '';

  if (!withLabels) {
    return { labelsCreated, labelsSkipReason };
  }

  if (dryRun) {
    labelsSkipReason = 'Skipped in dry-run.';
    console.log('  [dry-run] Labels would be created via gh (skipped)');
    return { labelsCreated, labelsSkipReason };
  }

  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
  } catch {
    labelsSkipReason = 'gh CLI not installed. Install from https://cli.github.com/';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  if (!fs.existsSync(path.join(targetAbs, '.git'))) {
    labelsSkipReason = 'Target is not a git repository.';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  try {
    execFileSync('gh', ['auth', 'status'], { cwd: targetAbs, stdio: 'ignore' });
  } catch {
    labelsSkipReason = 'gh CLI not authenticated. Run: gh auth login';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  try {
    execFileSync('gh', ['repo', 'view'], { cwd: targetAbs, stdio: 'ignore' });
  } catch {
    labelsSkipReason = 'Target repo not on GitHub or no API access.';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  for (const [name, color] of LABELS) {
    try {
      execFileSync('gh', ['label', 'create', name, '--color', color], {
        cwd: targetAbs,
        stdio: 'pipe',
      });
      console.log(`  Created label: ${name}`);
      labelsCreated++;
    } catch (err) {
      const msg = err.stderr?.toString() || err.message || '';
      if (/already exists/i.test(msg)) {
        console.log(`  Skipped (exists): ${name}`);
      } else {
        console.log(`  Failed to create label '${name}': ${msg.trim()}`);
      }
    }
  }

  return { labelsCreated, labelsSkipReason };
}

function runLabelsGitlab({ targetAbs, withLabels, dryRun }) {
  let labelsCreated = 0;
  let labelsSkipReason = '';

  if (!withLabels) {
    return { labelsCreated, labelsSkipReason };
  }

  if (dryRun) {
    labelsSkipReason = 'Skipped in dry-run.';
    console.log('  [dry-run] Labels would be created via glab (skipped)');
    return { labelsCreated, labelsSkipReason };
  }

  try {
    execFileSync('glab', ['version'], { stdio: 'ignore' });
  } catch {
    labelsSkipReason = 'glab CLI not installed. See https://gitlab.com/gitlab-org/cli/';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  if (!fs.existsSync(path.join(targetAbs, '.git'))) {
    labelsSkipReason = 'Target is not a git repository.';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  try {
    execFileSync('glab', ['auth', 'status'], { cwd: targetAbs, stdio: 'ignore' });
  } catch {
    labelsSkipReason = 'glab not authenticated. Run: glab auth login';
    console.log(`  Skipped labels: ${labelsSkipReason}`);
    return { labelsCreated, labelsSkipReason };
  }

  for (const [name, color] of LABELS) {
    try {
      execFileSync('glab', ['label', 'create', name, '--color', color], {
        cwd: targetAbs,
        stdio: 'pipe',
      });
      console.log(`  Created label: ${name}`);
      labelsCreated++;
    } catch (err) {
      const msg = err.stderr?.toString() || err.message || '';
      if (/already been taken|already exists/i.test(msg)) {
        console.log(`  Skipped (exists): ${name}`);
      } else {
        console.log(`  Failed to create label '${name}': ${msg.trim()}`);
      }
    }
  }

  return { labelsCreated, labelsSkipReason };
}

function printGithubNextSteps({
  dryRun,
  withTemplates,
  workflowsCopied,
  actionCopied,
  templatesCopied,
  labelsCreated,
  labelsSkipReason,
}) {
  if (
    workflowsCopied > 0 ||
    actionCopied > 0 ||
    templatesCopied > 0 ||
    labelsCreated > 0
  ) {
    if (dryRun) {
      if (workflowsCopied > 0) console.log(`Would install ${workflowsCopied} workflow(s).`);
      if (actionCopied > 0) console.log('Would install composite action .github/actions/delivery-os-run.');
      if (templatesCopied > 0) console.log(`Would copy ${templatesCopied} issue template(s).`);
      if (labelsCreated > 0) console.log(`Would create ${labelsCreated} label(s).`);
    } else {
      if (workflowsCopied > 0) console.log(`Installed ${workflowsCopied} workflow(s).`);
      if (actionCopied > 0) console.log('Installed composite action .github/actions/delivery-os-run.');
      if (templatesCopied > 0) console.log(`Copied ${templatesCopied} issue template(s).`);
      if (labelsCreated > 0) console.log(`Created ${labelsCreated} label(s).`);
    }
    console.log('');
    console.log('Next steps:');
    console.log('  1. Create labels: Actions → DeliveryOS — Labels → Run workflow');
    if (labelsSkipReason) console.log(`     (Labels skipped: ${labelsSkipReason})`);
    console.log('  2. Configure repo variables (Settings → Secrets and variables → Actions):');
    console.log('     - RELEASE_APPROVER, QA_APPROVER, QA_ASSIGNEES (usernames)');
    console.log('  3. Add secrets (optional): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
    if (!withTemplates) {
      console.log('  4. Copy templates: re-run with --with-templates');
    }
    console.log('');
    console.log('See docs/platform-ci.md for GitLab and variable parity.');
  } else if (dryRun) {
    console.log('Dry run complete. No files would be changed.');
  } else {
    console.log('No new files created (existing files were skipped).');
    console.log('To update: use --overwrite (use --dry-run first to preview).');
  }
}

function printGitlabNextSteps({
  dryRun,
  withTemplates,
  ciCopied,
  templatesCopied,
  labelsCreated,
  labelsSkipReason,
}) {
  if (ciCopied > 0 || templatesCopied > 0 || labelsCreated > 0) {
    if (dryRun) {
      if (ciCopied > 0) console.log('Would install .gitlab-ci.yml bundle.');
      if (templatesCopied > 0) console.log(`Would copy ${templatesCopied} issue template(s).`);
    } else {
      if (ciCopied > 0) console.log('Installed GitLab CI bundle (.gitlab-ci.yml).');
      if (templatesCopied > 0) console.log(`Copied ${templatesCopied} issue template(s).`);
      if (labelsCreated > 0) console.log(`Created ${labelsCreated} label(s).`);
    }
    console.log('');
    console.log('Next steps:');
    console.log('  1. Settings → CI/CD → Variables: RELEASE_APPROVER, QA_APPROVER, QA_ASSIGNEES');
    console.log('  2. Optional secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
    console.log('  3. Push to default branch to publish Pages from docs/ (if present)');
    if (labelsSkipReason) console.log(`     (Labels skipped: ${labelsSkipReason})`);
    if (!withTemplates) {
      console.log('  4. Re-run with --with-templates for .gitlab/issue_templates');
    }
    console.log('');
    console.log('Issue webhooks and sprint automation differ from GitHub Actions; see docs/platform-ci.md.');
  } else if (dryRun) {
    console.log('Dry run complete. No files would be changed.');
  } else {
    console.log('No new files created (existing files were skipped).');
    console.log('To update: use --overwrite (use --dry-run first to preview).');
  }
}

function runStatus(options) {
  const { targetDir = '.' } = options;
  const targetAbs = path.resolve(process.cwd(), targetDir);
  const workflowsDest = path.join(targetAbs, '.github', 'workflows');
  const templatesDest = path.join(targetAbs, '.github', 'ISSUE_TEMPLATE');
  const gitlabCi = path.join(targetAbs, '.gitlab-ci.yml');
  const gitlabTpl = path.join(targetAbs, '.gitlab', 'issue_templates');

  console.log('=== Delivery Operating System — Status ===');
  console.log(`Target: ${targetAbs}`);
  console.log('');

  const installedWorkflows = WORKFLOWS.filter((wf) =>
    fs.existsSync(path.join(workflowsDest, `${wf}.yml`))
  );
  const installedTemplates = TEMPLATES.filter((t) =>
    fs.existsSync(path.join(templatesDest, t))
  );
  const gitlabBundle = isGitlabBundleFile(gitlabCi);
  const installedGitlabTemplates = GITLAB_ISSUE_TEMPLATES.filter((t) =>
    fs.existsSync(path.join(gitlabTpl, t))
  );

  if (installedWorkflows.length > 0) {
    console.log('GitHub Actions workflows:');
    installedWorkflows.forEach((wf) => console.log(`  ✓ ${wf}.yml`));
    console.log('');
  }
  if (installedTemplates.length > 0) {
    console.log('GitHub issue form templates:');
    installedTemplates.forEach((t) => console.log(`  ✓ ${t}`));
    console.log('');
  }
  if (gitlabBundle) {
    console.log('GitLab CI:');
    console.log('  ✓ .gitlab-ci.yml (DeliveryOS bundle)');
    console.log('');
  }
  if (installedGitlabTemplates.length > 0) {
    console.log('GitLab issue templates:');
    installedGitlabTemplates.forEach((t) => console.log(`  ✓ ${t}`));
    console.log('');
  }

  const missingWorkflows = WORKFLOWS.filter((wf) => !installedWorkflows.includes(wf));
  if (missingWorkflows.length > 0 && installedWorkflows.length > 0) {
    console.log('Missing GitHub workflows:');
    missingWorkflows.forEach((wf) => console.log(`  ○ ${wf}.yml`));
    console.log('');
  }

  const anyGithub = installedWorkflows.length > 0 || installedTemplates.length > 0;
  const anyGitlab = gitlabBundle || installedGitlabTemplates.length > 0;

  if (!anyGithub && !anyGitlab) {
    console.log('DeliveryOS is not installed in this repository.');
    console.log('Run: npx deliveryos install --with-templates .');
    console.log('Or:  npx deliveryos install --provider gitlab --with-templates .');
  } else {
    console.log(
      `Summary: ${installedWorkflows.length}/${WORKFLOWS.length} GitHub workflows, ` +
        `${installedTemplates.length}/${TEMPLATES.length} GitHub form templates, ` +
        `${gitlabBundle ? 1 : 0} GitLab CI bundle, ` +
        `${installedGitlabTemplates.length}/${GITLAB_ISSUE_TEMPLATES.length} GitLab markdown templates`
    );
  }
  console.log('');
}

function runUninstall(options) {
  const { targetDir = '.', withTemplates = false, dryRun = false, provider = 'all' } = options;
  const targetAbs = path.resolve(process.cwd(), targetDir);
  const workflowsDest = path.join(targetAbs, '.github', 'workflows');
  const templatesDest = path.join(targetAbs, '.github', 'ISSUE_TEMPLATE');
  const gitlabCi = path.join(targetAbs, '.gitlab-ci.yml');
  const gitlabTplDir = path.join(targetAbs, '.gitlab', 'issue_templates');

  const p = String(provider || 'all').toLowerCase();
  if (!['github', 'gitlab', 'all'].includes(p)) {
    throw new Error('Uninstall provider must be github, gitlab, or all');
  }

  console.log('=== Delivery Operating System — Uninstall ===');
  console.log(`Target: ${targetAbs}`);
  if (p !== 'all') console.log(`Provider filter: ${p}`);
  if (dryRun) console.log('Mode: dry-run (no files will be deleted)');
  console.log('');

  let workflowsRemoved = 0;
  let templatesRemoved = 0;
  let gitlabCiRemoved = 0;
  let gitlabTplRemoved = 0;

  const doGithub = p === 'github' || p === 'all';
  const doGitlab = p === 'gitlab' || p === 'all';

  if (doGithub) {
    const actionComposable = path.join(
      targetAbs,
      '.github',
      'actions',
      'delivery-os-run',
      'action.yml'
    );
    if (fs.existsSync(actionComposable)) {
      if (dryRun) {
        console.log('  [dry-run] Would remove: .github/actions/delivery-os-run/action.yml');
      } else {
        fs.unlinkSync(actionComposable);
        console.log('  Removed: .github/actions/delivery-os-run/action.yml');
      }
      try {
        fs.rmdirSync(path.join(targetAbs, '.github', 'actions', 'delivery-os-run'));
        fs.rmdirSync(path.join(targetAbs, '.github', 'actions'));
      } catch {
        /* ignore */
      }
    }

    for (const wf of WORKFLOWS) {
      const dest = path.join(workflowsDest, `${wf}.yml`);
      if (fs.existsSync(dest)) {
        if (dryRun) {
          console.log(`  [dry-run] Would remove: ${wf}.yml`);
        } else {
          fs.unlinkSync(dest);
          console.log(`  Removed: ${wf}.yml`);
        }
        workflowsRemoved++;
      }
    }

    if (withTemplates) {
      for (const t of TEMPLATES) {
        const dest = path.join(templatesDest, t);
        if (fs.existsSync(dest)) {
          if (dryRun) {
            console.log(`  [dry-run] Would remove GitHub template: ${t}`);
          } else {
            fs.unlinkSync(dest);
            console.log(`  Removed GitHub template: ${t}`);
          }
          templatesRemoved++;
        }
      }
    }
  }

  if (doGitlab) {
    if (isGitlabBundleFile(gitlabCi)) {
      if (dryRun) {
        console.log('  [dry-run] Would remove: .gitlab-ci.yml (DeliveryOS bundle)');
      } else {
        fs.unlinkSync(gitlabCi);
        console.log('  Removed: .gitlab-ci.yml (DeliveryOS bundle)');
      }
      gitlabCiRemoved++;
    } else if (fs.existsSync(gitlabCi)) {
      console.log('  Left in place: .gitlab-ci.yml (not a DeliveryOS bundle file)');
    }

    if (withTemplates) {
      for (const t of GITLAB_ISSUE_TEMPLATES) {
        const dest = path.join(gitlabTplDir, t);
        if (fs.existsSync(dest)) {
          if (dryRun) {
            console.log(`  [dry-run] Would remove GitLab template: ${t}`);
          } else {
            fs.unlinkSync(dest);
            console.log(`  Removed GitLab template: ${t}`);
          }
          gitlabTplRemoved++;
        }
      }
    }
  }

  console.log('');
  const touched =
    workflowsRemoved + templatesRemoved + gitlabCiRemoved + gitlabTplRemoved;
  if (touched > 0) {
    if (dryRun) {
      console.log(
        `Would remove ${workflowsRemoved} GitHub workflow(s), ${templatesRemoved} GitHub template(s), ` +
          `${gitlabCiRemoved} GitLab CI file(s), ${gitlabTplRemoved} GitLab template(s).`
      );
    } else {
      console.log(
        `Removed ${workflowsRemoved} GitHub workflow(s), ${templatesRemoved} GitHub template(s), ` +
          `${gitlabCiRemoved} GitLab CI file(s), ${gitlabTplRemoved} GitLab template(s).`
      );
      if (!withTemplates) {
        console.log('Templates were kept. Re-run with --with-templates to remove them.');
      }
    }
  } else {
    console.log('No DeliveryOS files found to remove (for selected provider).');
  }
  console.log('');
  console.log('=== Uninstall complete ===');
}

module.exports = { runInstall, runStatus, runUninstall };
