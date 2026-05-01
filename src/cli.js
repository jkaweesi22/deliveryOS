#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { runInstall, runStatus, runUninstall } = require('./install');

const pkgPath = path.join(__dirname, '..', 'package.json');
const version = fs.existsSync(pkgPath)
  ? require(pkgPath).version
  : '1.0.0';

program
  .name('delivery-os')
  .description(
    'DeliveryOS — sprint, QA, and release governance (GitHub, GitLab, and extensible providers)'
  )
  .version(version);

program
  .command('install [target]')
  .description('Install workflows / CI bundle and templates into a repository')
  .option(
    '-p, --provider <name>',
    'github (default) or gitlab',
    (v) => String(v).toLowerCase(),
    'github'
  )
  .option('-t, --with-templates', 'Copy issue templates (sprint, task, bug, QA, production release)')
  .option(
    '-l, --with-labels',
    'Create labels via gh (GitHub) or glab (GitLab) when installed'
  )
  .option('-o, --overwrite', 'Replace existing workflow/template files')
  .option('--no-overwrite', 'Skip existing files (default)')
  .option('-d, --dry-run', 'Show what would happen without changing files')
  .action((target, options) => {
    const targetDir = target || '.';
    runInstall({
      targetDir,
      provider: options.provider ?? 'github',
      withTemplates: options.withTemplates ?? false,
      withLabels: options.withLabels ?? false,
      overwrite: options.overwrite ?? false,
      dryRun: options.dryRun ?? false,
    });
  });

program
  .command('status [target]')
  .description('Show which workflows and templates are installed')
  .action((target) => {
    runStatus({ targetDir: target || '.' });
  });

program
  .command('uninstall [target]')
  .description('Remove DeliveryOS workflows (and optionally templates)')
  .option(
    '-p, --provider <name>',
    'github, gitlab, or all (default all)',
    (v) => String(v).toLowerCase(),
    'all'
  )
  .option('-t, --with-templates', 'Also remove issue templates')
  .option('-d, --dry-run', 'Show what would be removed without deleting')
  .action((target, options) => {
    runUninstall({
      targetDir: target || '.',
      provider: options.provider ?? 'all',
      withTemplates: options.withTemplates ?? false,
      dryRun: options.dryRun ?? false,
    });
  });

program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
