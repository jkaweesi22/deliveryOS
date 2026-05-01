import { loadConfig, toRuntimeConfig } from '../config/loadConfig.js';
import { DELIVERY_LABELS } from '../core/labels.js';
import { createProvider } from '../providers/factory.js';
import { logger } from '../logger.js';

export async function runLabelsEnsure(): Promise<void> {
  const cfg = loadConfig({ requirePayload: false });
  if (!cfg.token) {
    throw new Error('Missing token: set DELIVERY_OS_TOKEN, GITHUB_TOKEN, or GITLAB_TOKEN');
  }

  const runtime = toRuntimeConfig(cfg);
  const provider = createProvider(runtime);

  if (cfg.dryRun) {
    logger.info({ msg: 'dry-run: would ensure labels', count: DELIVERY_LABELS.length });
    return;
  }

  for (const { name, color } of DELIVERY_LABELS) {
    await provider.ensureLabel(name, color);
    logger.info({ msg: 'label ensured', name });
  }
}
