import type { IssuesEventPayload } from '../core/types.js';
import type { DeliveryProvider } from '../providers/types.js';
import type { RuntimeConfig } from '../core/types.js';
import { logger } from '../logger.js';

function hasLabel(labels: string[], name: string): boolean {
  return labels.some((l) => l.toLowerCase() === name.toLowerCase());
}

export async function handleQaAssign(
  payload: IssuesEventPayload,
  provider: DeliveryProvider,
  cfg: RuntimeConfig
): Promise<void> {
  if (!cfg.qaAssignees.trim()) return;
  if (payload.action !== 'opened' && payload.action !== 'labeled') return;

  const labels = payload.issue.labels;
  if (!hasLabel(labels, 'qa') && !hasLabel(labels, 'qa-request')) return;

  const assignees = cfg.qaAssignees
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (assignees.length === 0) return;

  if (cfg.dryRun) {
    logger.info({
      msg: 'dry-run: would assign QA',
      issue: payload.issue.number,
      assignees,
    });
    return;
  }

  await provider.setAssignees(payload.issue.number, assignees);
  logger.info({ msg: 'assigned QA', issue: payload.issue.number, assignees });
}
