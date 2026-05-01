import type { CommentEventPayload } from '../core/types.js';
import type { DeliveryProvider } from '../providers/types.js';
import type { RuntimeConfig } from '../core/types.js';
import { evaluateDualApproval } from '../core/approvals/evaluateDualApproval.js';
import { logger } from '../logger.js';

function hasLabel(labels: string[], name: string): boolean {
  return labels.some((l) => l.toLowerCase() === name.toLowerCase());
}

export async function handleAuthorizeDeployment(
  payload: CommentEventPayload,
  provider: DeliveryProvider,
  cfg: RuntimeConfig
): Promise<void> {
  if (payload.action !== 'created') return;
  if (!hasLabel(payload.issue.labels, 'production')) return;

  const comments = await provider.listIssueComments(payload.issue.number);
  const outcome = evaluateDualApproval(comments, cfg.releaseApprover, cfg.qaApprover);

  if (outcome.kind === 'noop') {
    return;
  }

  if (cfg.dryRun) {
    logger.info({ msg: 'dry-run authorize', outcome: outcome.kind, issue: payload.issue.number });
    return;
  }

  if (outcome.kind === 'declined') {
    await provider.addLabels(payload.issue.number, ['declined']);
    try {
      await provider.removeLabel(payload.issue.number, 'ready-for-deploy');
    } catch {
      /* ignore */
    }
    await provider.createComment(
      payload.issue.number,
      '🔴 **Release Declined**\n\nThis release requires additional fixes before production deployment.'
    );
    logger.info({ msg: 'release declined', issue: payload.issue.number });
    return;
  }

  try {
    await provider.addLabels(payload.issue.number, ['ready-for-deploy']);
  } catch {
    /* ignore */
  }
  await provider.createComment(
    payload.issue.number,
    '🟢🚀 **Deployment Authorized**\n\nDual approval received. This release is cleared for production deployment.'
  );
  logger.info({ msg: 'deployment authorized', issue: payload.issue.number });
}
