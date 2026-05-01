import type { IssuesEventPayload } from '../core/types.js';
import type { DeliveryProvider } from '../providers/types.js';
import type { RuntimeConfig } from '../core/types.js';
import { buildReleaseApproverPing } from '../core/notify/releaseApproverComment.js';
import { logger } from '../logger.js';

function hasLabel(labels: string[], name: string): boolean {
  return labels.some((l) => l.toLowerCase() === name.toLowerCase());
}

export async function handleNotifyReleaseApprover(
  payload: IssuesEventPayload,
  provider: DeliveryProvider,
  cfg: RuntimeConfig
): Promise<void> {
  if (payload.action !== 'opened') return;
  if (!hasLabel(payload.issue.labels, 'production')) return;

  const body = buildReleaseApproverPing({
    approverLogin: cfg.releaseApprover,
    projectName: cfg.projectName,
    issueTitle: payload.issue.title,
    issueBody: payload.issue.body,
  });

  if (cfg.dryRun) {
    logger.info({ msg: 'dry-run: would notify release approver', issue: payload.issue.number });
    return;
  }

  await provider.createComment(payload.issue.number, body);
  logger.info({ msg: 'posted release approver ping', issue: payload.issue.number });
}
