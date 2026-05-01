#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runApprovalEvent } from './commands/approvalEvent.js';
import { runIssueEvent } from './commands/issueEvent.js';
import { runLabelsEnsure } from './commands/labelsEnsure.js';
import { runNotify } from './commands/notify.js';
import { runReleaseCheck } from './commands/releaseCheck.js';
import { logger } from './logger.js';

function readVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const p = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return p.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('delivery-os')
    .description('Delivery OS automation (issue governance, approvals, notify)')
    .version(readVersion());

  program
    .command('issue-event')
    .description('Handle issues webhook (sprint children, release ping, QA assign, sprint burn-down)')
    .action(async () => {
      await runIssueEvent();
    });

  program
    .command('approval-event')
    .description('Handle issue_comment webhook (dual approval / decline for production issues)')
    .action(async () => {
      await runApprovalEvent();
    });

  program
    .command('notify')
    .description('Send Telegram notification from normalized webhook payload')
    .action(async () => {
      await runNotify();
    });

  program
    .command('labels-ensure')
    .description('Create Delivery OS labels if missing')
    .action(async () => {
      await runLabelsEnsure();
    });

  program
    .command('release-check')
    .description('Placeholder for future production readiness checks')
    .action(async () => {
      await runReleaseCheck();
    });

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ msg, err: String(err) });
    process.exitCode = 1;
  }
}

void main();
