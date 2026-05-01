import type { LoadedConfig } from '../config/loadConfig.js';
import { normalizeGithubWebhook } from '../normalize/github.js';
import { normalizeGitlabWebhook } from '../normalize/gitlab.js';
import type { WebhookPayload } from '../core/types.js';

export function parseWebhook(cfg: LoadedConfig): WebhookPayload | null {
  if (cfg.provider === 'github') {
    const name = (cfg.eventName || process.env.GITHUB_EVENT_NAME || '').trim();
    if (!name) {
      throw new Error('GitHub: set GITHUB_EVENT_NAME (default) or DELIVERY_OS_EVENT_TYPE');
    }
    return normalizeGithubWebhook(name, cfg.rawPayload);
  }

  if (cfg.provider === 'gitlab') {
    return normalizeGitlabWebhook('', cfg.rawPayload);
  }

  throw new Error(`Webhook parsing not implemented for provider: ${cfg.provider}`);
}
