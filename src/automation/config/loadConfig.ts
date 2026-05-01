import fs from 'node:fs';

function inferProviderFromEnv(): string {
  if (process.env.DELIVERY_OS_PROVIDER) return process.env.DELIVERY_OS_PROVIDER;
  if (process.env.GITHUB_ACTIONS === 'true') return 'github';
  if (process.env.GITLAB_CI === 'true') return 'gitlab';
  return 'github';
}

export interface LoadedConfig {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'codeberg';
  token: string;
  apiBaseUrl?: string;
  repoFullName?: string;
  projectId?: string;
  /** When true, GitLab REST calls use Bearer instead of Private-Token header. */
  gitlabUseBearer: boolean;
  eventName: string;
  rawPayload: unknown;
  /** When false, rawPayload may be empty (e.g. labels-ensure) */
  hasPayload: boolean;
  releaseApprover: string;
  qaApprover: string;
  qaAssignees: string;
  projectName: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  dryRun: boolean;
  defaultBranch: string;
  timezone: string;
}

export function readPayloadOrThrow(): unknown {
  if (process.env.DELIVERY_OS_PAYLOAD_PATH) {
    const p = process.env.DELIVERY_OS_PAYLOAD_PATH;
    return JSON.parse(fs.readFileSync(p, 'utf8')) as unknown;
  }
  if (process.env.DELIVERY_OS_PAYLOAD) {
    return JSON.parse(process.env.DELIVERY_OS_PAYLOAD) as unknown;
  }
  if (process.env.GITHUB_EVENT_PATH) {
    return JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) as unknown;
  }
  throw new Error(
    'No webhook payload: set DELIVERY_OS_PAYLOAD_PATH, DELIVERY_OS_PAYLOAD, or GITHUB_EVENT_PATH.'
  );
}

function parseBool(v: string | undefined): boolean {
  return ['1', 'true', 'yes'].includes((v || '').toLowerCase());
}

export function loadConfig(opts: { requirePayload: boolean }): LoadedConfig {
  const provider = inferProviderFromEnv().toLowerCase() as LoadedConfig['provider'];
  if (!['github', 'gitlab', 'bitbucket', 'codeberg'].includes(provider)) {
    throw new Error(`Invalid DELIVERY_OS_PROVIDER: ${provider}`);
  }

  const token =
    process.env.DELIVERY_OS_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GITLAB_TOKEN ||
    '';

  const hasPayload = opts.requirePayload;
  const rawPayload = hasPayload ? readPayloadOrThrow() : {};

  const eventName =
    process.env.DELIVERY_OS_EVENT_TYPE || process.env.GITHUB_EVENT_NAME || '';

  const apiBaseUrl =
    process.env.DELIVERY_OS_API_URL ||
    process.env.CI_API_V4_URL ||
    undefined;

  return {
    provider,
    token,
    apiBaseUrl,
    repoFullName: process.env.DELIVERY_OS_REPO || process.env.GITHUB_REPOSITORY,
    projectId: process.env.DELIVERY_OS_PROJECT_ID || process.env.CI_PROJECT_ID,
    gitlabUseBearer: parseBool(process.env.DELIVERY_OS_GITLAB_USE_BEARER),
    eventName,
    rawPayload,
    hasPayload,
    releaseApprover: process.env.RELEASE_APPROVER || 'release-approver',
    qaApprover: process.env.QA_APPROVER || 'qa-approver',
    qaAssignees: process.env.QA_ASSIGNEES || '',
    projectName: process.env.PROJECT_NAME || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    dryRun: parseBool(process.env.DELIVERY_OS_DRY_RUN),
    defaultBranch:
      process.env.DELIVERY_OS_DEFAULT_BRANCH ||
      process.env.DEFAULT_BRANCH ||
      process.env.CI_DEFAULT_BRANCH ||
      'main',
    timezone: process.env.DELIVERY_OS_TIMEZONE || 'Africa/Nairobi',
  };
}

export function toRuntimeConfig(cfg: LoadedConfig): import('../core/types.js').RuntimeConfig {
  return {
    provider: cfg.provider,
    token: cfg.token,
    apiBaseUrl: cfg.apiBaseUrl,
    repoFullName: cfg.repoFullName,
    projectId: cfg.projectId,
    gitlabUseBearer: cfg.gitlabUseBearer,
    eventName: cfg.eventName,
    rawPayload: cfg.rawPayload,
    releaseApprover: cfg.releaseApprover,
    qaApprover: cfg.qaApprover,
    qaAssignees: cfg.qaAssignees,
    projectName: cfg.projectName,
    telegramBotToken: cfg.telegramBotToken,
    telegramChatId: cfg.telegramChatId,
    dryRun: cfg.dryRun,
    defaultBranch: cfg.defaultBranch,
    timezone: cfg.timezone,
  };
}
