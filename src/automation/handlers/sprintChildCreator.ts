import type { IssuesEventPayload } from '../core/types.js';
import type { DeliveryProvider } from '../providers/types.js';
import type { RuntimeConfig } from '../core/types.js';
import { parseSprintFeatures } from '../core/sprint/parseSprintFeatures.js';
import { logger } from '../logger.js';

const SPRINT_TITLE_MARK = 'SPRINT -';

export async function handleSprintChildCreator(
  payload: IssuesEventPayload,
  provider: DeliveryProvider,
  cfg: RuntimeConfig
): Promise<void> {
  if (payload.action !== 'opened') return;
  if (!payload.issue.title.includes(SPRINT_TITLE_MARK)) return;

  const features = parseSprintFeatures(payload.issue.body);
  if (features.length === 0) {
    logger.info({ msg: 'sprint-child: no features section', issue: payload.issue.number });
    return;
  }

  const bodyContent = `Parent Sprint: #${payload.issue.number}\n\n---\n*Created by Delivery OS Sprint Child Creator*`;

  if (cfg.dryRun) {
    logger.info({
      msg: 'dry-run: would create child issues',
      count: features.length,
      parent: payload.issue.number,
    });
    return;
  }

  for (const title of features) {
    await provider.createIssue({
      title,
      body: bodyContent,
      labels: ['sprint-active'],
    });
    logger.info({ msg: 'created sprint child issue', title });
  }
}
