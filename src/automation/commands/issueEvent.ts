import { hydrateFromPayload } from '../config/hydrate.js';
import { loadConfig, toRuntimeConfig } from '../config/loadConfig.js';
import { parseWebhook } from '../dispatch/parseWebhook.js';
import { createProvider } from '../providers/factory.js';
import { handleAutoCloseSprint } from '../handlers/autoCloseSprint.js';
import { handleNotifyReleaseApprover } from '../handlers/notifyReleaseApprover.js';
import { handleQaAssign } from '../handlers/qaAssign.js';
import { handleSprintChildCreator } from '../handlers/sprintChildCreator.js';
import { logger } from '../logger.js';

export async function runIssueEvent(): Promise<void> {
  const cfg = loadConfig({ requirePayload: true });
  hydrateFromPayload(cfg);
  if (!cfg.token) {
    throw new Error('Missing token: set DELIVERY_OS_TOKEN, GITHUB_TOKEN, or GITLAB_TOKEN');
  }

  const runtime = toRuntimeConfig(cfg);
  const provider = createProvider(runtime);

  const webhook = parseWebhook(cfg);
  if (!webhook || webhook.eventName !== 'issues') {
    logger.info({
      msg: 'issue-event: skipped (not an issues webhook)',
      ...(webhook ? { event: webhook.eventName } : {}),
    });
    return;
  }

  const payload = webhook.payload;
  await handleSprintChildCreator(payload, provider, runtime);
  await handleNotifyReleaseApprover(payload, provider, runtime);
  await handleQaAssign(payload, provider, runtime);
  await handleAutoCloseSprint(payload, provider, runtime);
}
