import { loadConfig, toRuntimeConfig } from '../config/loadConfig.js';
import { parseWebhook } from '../dispatch/parseWebhook.js';
import { buildTelegramMessage, sendTelegramMessage } from '../core/notify/telegramMessage.js';
import { formatTimestamp } from '../util/timeformat.js';
import { logger } from '../logger.js';

export async function runNotify(): Promise<void> {
  const cfg = loadConfig({ requirePayload: true });

  if (!cfg.telegramBotToken || !cfg.telegramChatId) {
    logger.info({ msg: 'notify: Telegram not configured, skipping' });
    return;
  }

  const webhook = parseWebhook(cfg);
  if (!webhook) {
    logger.info({ msg: 'notify: no webhook parsed' });
    return;
  }

  const runtime = toRuntimeConfig(cfg);
  const timestamp = formatTimestamp(runtime.timezone);

  if (webhook.eventName === 'issues') {
    const p = webhook.payload;
    const text = buildTelegramMessage({
      eventName: 'issues',
      eventAction: p.action,
      actor: p.sender.login,
      issue: {
        title: p.issue.title,
        htmlUrl: p.issue.htmlUrl,
        labels: p.issue.labels,
      },
      releaseApprover: cfg.releaseApprover,
      timestamp,
      defaultBranch: runtime.defaultBranch,
    });
    if (!text) {
      logger.info({ msg: 'notify: no matching telegram template for issue' });
      return;
    }
    if (cfg.dryRun) {
      logger.info({ msg: 'dry-run telegram', text });
      return;
    }
    await sendTelegramMessage(cfg.telegramBotToken, cfg.telegramChatId, text);
    return;
  }

  if (webhook.eventName === 'issue_comment') {
    const p = webhook.payload;
    const text = buildTelegramMessage({
      eventName: 'issue_comment',
      eventAction: p.action,
      actor: p.sender.login,
      issue: {
        title: p.issue.title,
        htmlUrl: p.issue.htmlUrl,
        labels: p.issue.labels,
      },
      commentBody: p.comment.body,
      releaseApprover: cfg.releaseApprover,
      timestamp,
      defaultBranch: runtime.defaultBranch,
    });
    if (!text) {
      logger.info({ msg: 'notify: no matching telegram template for comment' });
      return;
    }
    if (cfg.dryRun) {
      logger.info({ msg: 'dry-run telegram', text });
      return;
    }
    await sendTelegramMessage(cfg.telegramBotToken, cfg.telegramChatId, text);
    return;
  }

  if (webhook.eventName === 'pull_request') {
    const p = webhook.payload;
    const text = buildTelegramMessage({
      eventName: 'pull_request',
      eventAction: p.action,
      actor: p.sender.login,
      releaseApprover: cfg.releaseApprover,
      timestamp,
      defaultBranch: runtime.defaultBranch,
      pullRequest: {
        merged: p.pull_request.merged,
        baseRef: p.pull_request.base.ref,
        title: p.pull_request.title,
        htmlUrl: p.pull_request.html_url,
      },
    });
    if (!text) {
      logger.info({ msg: 'notify: no matching telegram template for PR' });
      return;
    }
    if (cfg.dryRun) {
      logger.info({ msg: 'dry-run telegram', text });
      return;
    }
    await sendTelegramMessage(cfg.telegramBotToken, cfg.telegramChatId, text);
    return;
  }

  logger.info({ msg: 'notify: unsupported event shape' });
}
