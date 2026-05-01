import type {
  CommentEventPayload,
  IssuesEventPayload,
  NormalizedIssue,
  NormalizedRepository,
  PullRequestEventPayload,
  WebhookPayload,
} from '../core/types.js';
import { ensureGitlabProjectId } from './gitlabProject.js';

export { ensureGitlabProjectId } from './gitlabProject.js';

function mapGlLabels(labels: unknown): string[] {
  if (!Array.isArray(labels)) return [];
  return labels
    .map((l) => {
      if (typeof l === 'string') return l;
      if (l && typeof l === 'object') {
        const o = l as { title?: string; name?: string };
        return o.title || o.name || '';
      }
      return '';
    })
    .filter(Boolean);
}

/**
 * Map GitLab Issue Hook `action` + optional `changes` to GitHub-style issue event actions.
 * Generic `update` without label changes becomes `updated` (ignored by QA/sprint handlers).
 */
export function mapGlIssueAction(raw: Record<string, unknown>, attrs: Record<string, unknown>): string {
  const action = String(attrs.action || '').toLowerCase();
  if (action === 'open') return 'opened';
  if (action === 'close') return 'closed';
  if (action === 'reopen') return 'reopened';
  if (action === 'update') {
    const changes = raw.changes as Record<string, unknown> | undefined;
    if (changes && changes.labels !== undefined) return 'labeled';
    return 'updated';
  }
  return action;
}

export interface GitlabProjectSlice {
  id?: number;
  path_with_namespace?: string;
  web_url?: string;
  default_branch?: string;
}

function glIssueFromHook(attrs: Record<string, unknown>, project: GitlabProjectSlice): NormalizedIssue {
  const iid = Number(attrs.iid);
  const pathNs = String(project.path_with_namespace || '');
  const directUrl = String(
    (attrs as { url?: string; web_url?: string }).url || (attrs as { web_url?: string }).web_url || ''
  );
  const webUrl =
    directUrl ||
    (project.web_url ? `${String(project.web_url).replace(/\/$/, '')}/-/issues/${iid}` : '');
  let htmlUrl = webUrl;
  if (!htmlUrl && pathNs) {
    const host = process.env.CI_SERVER_HOST || 'gitlab.com';
    const protocol = process.env.CI_SERVER_PROTOCOL || 'https';
    const base =
      process.env.DELIVERY_OS_WEB_URL || (pathNs ? `${protocol}://${host}/${pathNs}` : '');
    htmlUrl = base ? `${base}/-/issues/${iid}` : '';
  }

  return {
    id: String(attrs.id ?? ''),
    number: iid,
    title: String(attrs.title || ''),
    body: String(attrs.description || ''),
    state: attrs.state === 'opened' ? 'open' : 'closed',
    labels: mapGlLabels(attrs.labels),
    htmlUrl,
    authorLogin: (attrs.author as { username?: string } | undefined)?.username,
  };
}

function repositoryFromProject(project: GitlabProjectSlice | undefined): NormalizedRepository {
  const pathNs = String(project?.path_with_namespace || '');
  const projectId = String(project?.id ?? '');
  return {
    fullName: pathNs,
    projectId,
  };
}

/**
 * GitLab Issue, Note (on issue), and Merge Request (merged) hooks → unified payloads.
 *
 * Webhooks: enable **Issues events**, **Comments**, and (for Telegram “merge to default branch”) **Merge request events**.
 */
export function normalizeGitlabWebhook(_eventType: string, raw: unknown): WebhookPayload | null {
  const r = raw as Record<string, unknown>;
  ensureGitlabProjectId(raw);

  const project = r.project as GitlabProjectSlice | undefined;
  const pathNs = String(project?.path_with_namespace || '');
  const projectId = String(project?.id ?? r.project_id ?? '');
  const repository = repositoryFromProject(project);

  if (r.object_kind === 'issue') {
    const attrs = r.object_attributes as Record<string, unknown>;
    const issue = glIssueFromHook(attrs, project ?? { path_with_namespace: pathNs, id: Number(projectId) });
    const user = r.user as { username?: string } | undefined;
    const p: IssuesEventPayload = {
      action: mapGlIssueAction(r, attrs),
      issue,
      repository,
      sender: { login: String(user?.username || '') },
    };
    return { eventName: 'issues', payload: p };
  }

  if (r.object_kind === 'note') {
    const attrs = r.object_attributes as Record<string, unknown>;
    const noteableType = String(attrs.noteable_type || '');
    if (noteableType !== 'Issue') return null;

    const issueRaw = r.issue as Record<string, unknown> | undefined;
    if (!issueRaw) return null;

    const issue = glIssueFromHook(issueRaw, project ?? { path_with_namespace: pathNs, id: Number(projectId) });

    const user = r.user as { username?: string } | undefined;
    const authorLogin = String(user?.username || '');

    const p: CommentEventPayload = {
      action: 'created',
      issue,
      comment: {
        body: String(attrs.note || ''),
        authorLogin,
      },
      repository,
      sender: { login: authorLogin },
    };
    return { eventName: 'issue_comment', payload: p };
  }

  if (r.object_kind === 'merge_request') {
    const attrs = r.object_attributes as Record<string, unknown>;
    const action = String(attrs.action || '').toLowerCase();
    if (action !== 'merge') return null;

    const targetBranch = String(attrs.target_branch || '');
    const mriid = attrs.iid != null ? Number(attrs.iid) : NaN;
    const mrUrl =
      String((attrs as { url?: string; web_url?: string }).url || (attrs as { web_url?: string }).web_url || '') ||
      (project?.web_url && !Number.isNaN(mriid)
        ? `${String(project.web_url).replace(/\/$/, '')}/-/merge_requests/${mriid}`
        : '');

    const user = r.user as { username?: string } | undefined;
    const p: PullRequestEventPayload = {
      action: 'closed',
      pull_request: {
        merged: true,
        base: { ref: targetBranch },
        title: String(attrs.title || ''),
        html_url: mrUrl,
      },
      repository,
      sender: { login: String(user?.username || '') },
    };
    return { eventName: 'pull_request', payload: p };
  }

  return null;
}
