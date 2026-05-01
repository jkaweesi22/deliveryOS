import type { LoadedConfig } from './loadConfig.js';
import { ensureGitlabProjectId } from '../normalize/gitlabProject.js';

export function hydrateFromPayload(cfg: LoadedConfig): void {
  if (cfg.provider !== 'gitlab' || !cfg.hasPayload) return;
  ensureGitlabProjectId(cfg.rawPayload);
  cfg.projectId =
    process.env.DELIVERY_OS_PROJECT_ID || process.env.CI_PROJECT_ID || cfg.projectId;
}
