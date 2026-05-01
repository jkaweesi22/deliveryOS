import type { IssuesEventPayload } from '../core/types.js';
import type { DeliveryProvider, IssueSummary } from '../providers/types.js';
import type { RuntimeConfig } from '../core/types.js';
import { parseParentSprintNumber } from '../core/sprint/parentSprintNumber.js';
import { parseSprintDates } from '../core/sprint/sprintDates.js';
import { computeSprintHealth } from '../core/sprint/burnDown.js';
import { sendTelegramMessage } from '../core/notify/telegramMessage.js';
import { logger } from '../logger.js';

export async function handleAutoCloseSprint(
  payload: IssuesEventPayload,
  provider: DeliveryProvider,
  cfg: RuntimeConfig
): Promise<void> {
  if (payload.action !== 'closed') return;

  const issue = payload.issue;
  const sprintNumber = parseParentSprintNumber(issue.body);
  if (sprintNumber === null) return;

  if (cfg.dryRun) {
    logger.info({
      msg: 'dry-run: would update sprint parent',
      sprintNumber,
      closedChild: issue.number,
    });
    return;
  }

  const sprintIssue = await provider.getIssue(sprintNumber);
  if (!sprintIssue) {
    logger.warn({ msg: 'sprint parent not found', sprintNumber });
    return;
  }

  const range = parseSprintDates(sprintIssue.body);
  if (!range) {
    logger.info({ msg: 'sprint dates not found on parent', sprintNumber });
    return;
  }

  const all = await provider.listIssuesForBurnDown();
  const marker = `Parent Sprint: #${sprintNumber}`;
  const children = all.filter((i: IssueSummary) => i.body.includes(marker));
  const closedChildren = children.filter((i: IssueSummary) => i.state === 'closed');

  const health = computeSprintHealth(
    sprintIssue.body,
    range,
    closedChildren.length,
    children.length,
    new Date()
  );

  await provider.updateIssue(sprintNumber, { body: health.updatedBody });

  if (health.progressPercent === 100) {
    await provider.updateIssue(sprintNumber, { state: 'closed' });
    await provider.createComment(
      sprintNumber,
      '🎉 All sprint tasks complete. Sprint automatically closed.'
    );

    if (cfg.telegramBotToken && cfg.telegramChatId) {
      const repoShort = cfg.repoFullName?.split('/').pop() || cfg.projectId || '';
      await sendTelegramMessage(cfg.telegramBotToken, cfg.telegramChatId, [
        '🚀 Sprint Completed!',
        '',
        sprintIssue.title,
        '',
        `Progress: 100%`,
        `Repository: ${repoShort}`,
      ].join('\n'));
    }
  }

  logger.info({
    msg: 'sprint burn-down updated',
    sprintNumber,
    progressPercent: health.progressPercent,
  });
}
