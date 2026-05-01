export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type ProviderName = 'github' | 'gitlab' | 'bitbucket' | 'codeberg';

export interface NormalizedLabel {
  name: string;
}

export interface NormalizedIssue {
  /** Provider-local id (GitHub node id string or GitLab id string) */
  id: string;
  /** User-facing number (GitHub number, GitLab iid) */
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  htmlUrl: string;
  authorLogin?: string;
}

export interface NormalizedComment {
  body: string;
  authorLogin: string;
}

export interface NormalizedRepository {
  fullName: string;
  /** GitLab project id (numeric string) */
  projectId?: string;
}

export interface IssuesEventPayload {
  action: string;
  issue: NormalizedIssue;
  repository: NormalizedRepository;
  sender: { login: string };
}

export interface CommentEventPayload {
  action: string;
  issue: NormalizedIssue;
  comment: NormalizedComment;
  repository: NormalizedRepository;
  sender: { login: string };
}

export interface PullRequestEventPayload {
  action: string;
  pull_request: {
    merged: boolean;
    base: { ref: string };
    title: string;
    html_url: string;
  };
  repository: NormalizedRepository;
  sender: { login: string };
}

export type WebhookPayload =
  | { eventName: 'issues'; payload: IssuesEventPayload }
  | { eventName: 'issue_comment'; payload: CommentEventPayload }
  | { eventName: 'pull_request'; payload: PullRequestEventPayload };

export interface RuntimeConfig {
  provider: ProviderName;
  token: string;
  apiBaseUrl?: string;
  /** owner/repo for GitHub */
  repoFullName?: string;
  /** GitLab project id */
  projectId?: string;
  /** Use `Authorization: Bearer` instead of `PRIVATE-TOKEN` (OAuth / some CI tokens). */
  gitlabUseBearer?: boolean;
  eventName: string;
  rawPayload: unknown;
  releaseApprover: string;
  qaApprover: string;
  qaAssignees: string;
  projectName: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  dryRun: boolean;
  defaultBranch: string;
  /** IANA timezone for Telegram / log timestamps */
  timezone: string;
}

export interface LabelDefinition {
  name: string;
  color: string;
}
