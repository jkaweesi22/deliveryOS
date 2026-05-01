import { hydrateFromPayload } from '../config/hydrate.js';
import { loadConfig, toRuntimeConfig } from '../config/loadConfig.js';
import { parseWebhook } from '../dispatch/parseWebhook.js';
import { createProvider } from '../providers/factory.js';
import { handleAuthorizeDeployment } from '../handlers/authorizeDeployment.js';
import { logger } from '../logger.js';

export async function runApprovalEvent(): Promise<void> {
  const cfg = loadConfig({ requirePayload: true });
  hydrateFromPayload(cfg);
  if (!cfg.token) {
    throw new Error('Missing token: set DELIVERY_OS_TOKEN, GITHUB_TOKEN, or GITLAB_TOKEN');
  }

  const runtime = toRuntimeConfig(cfg);
  const provider = createProvider(runtime);

  const webhook = parseWebhook(cfg);
  if (!webhook || webhook.eventName !== 'issue_comment') {
    logger.info({
      msg: 'approval-event: skipped (not issue_comment)',
      ...(webhook ? { event: webhook.eventName } : {}),
    });
    return;
  }

  await handleAuthorizeDeployment(webhook.payload, provider, runtime);
}
