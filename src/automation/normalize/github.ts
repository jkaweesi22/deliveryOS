import type {
  CommentEventPayload,
  IssuesEventPayload,
  NormalizedComment,
  NormalizedIssue,
  NormalizedRepository,
  PullRequestEventPayload,
  WebhookPayload,
} from '../core/types.js';

function mapGhLabels(labels: unknown): string[] {
  if (!Array.isArray(labels)) return [];
  return labels
    .map((l) => {
      if (typeof l === 'string') return l;
      if (l && typeof l === 'object' && 'name' in l) return String((l as { name: string }).name);
      return '';
    })
    .filter(Boolean);
}

function ghIssue(issue: Record<string, unknown>): NormalizedIssue {
  return {
    id: String(issue.id ?? ''),
    number: Number(issue.number),
    title: String(issue.title || ''),
    body: String(issue.body || ''),
    state: issue.state === 'open' ? 'open' : 'closed',
    labels: mapGhLabels(issue.labels),
    htmlUrl: String(issue.html_url || ''),
    authorLogin: (issue.user as { login?: string } | undefined)?.login,
  };
}

function ghRepo(repo: Record<string, unknown> | undefined): NormalizedRepository {
  return {
    fullName: String(repo?.full_name || ''),
  };
}

export function normalizeGithubWebhook(eventName: string, raw: unknown): WebhookPayload | null {
  const r = raw as Record<string, unknown>;

  if (eventName === 'issues') {
    const issue = r.issue as Record<string, unknown>;
    const repo = r.repository as Record<string, unknown>;
    const sender = r.sender as { login?: string };
    const p: IssuesEventPayload = {
      action: String(r.action || ''),
      issue: ghIssue(issue),
      repository: ghRepo(repo),
      sender: { login: String(sender?.login || '') },
    };
    return { eventName: 'issues', payload: p };
  }

  if (eventName === 'issue_comment') {
    const issue = r.issue as Record<string, unknown>;
    const comment = r.comment as Record<string, unknown>;
    const repo = r.repository as Record<string, unknown>;
    const sender = r.sender as { login?: string };
    const c: NormalizedComment = {
      body: String(comment?.body || ''),
      authorLogin: (comment?.user as { login?: string } | undefined)?.login || '',
    };
    const p: CommentEventPayload = {
      action: String(r.action || ''),
      issue: ghIssue(issue),
      comment: c,
      repository: ghRepo(repo),
      sender: { login: String(sender?.login || '') },
    };
    return { eventName: 'issue_comment', payload: p };
  }

  if (eventName === 'pull_request') {
    const pr = r.pull_request as Record<string, unknown>;
    const base = pr?.base as { ref?: string };
    const repo = r.repository as Record<string, unknown>;
    const sender = r.sender as { login?: string };
    const p: PullRequestEventPayload = {
      action: String(r.action || ''),
      pull_request: {
        merged: Boolean(pr?.merged),
        base: { ref: String(base?.ref || '') },
        title: String(pr?.title || ''),
        html_url: String(pr?.html_url || ''),
      },
      repository: ghRepo(repo),
      sender: { login: String(sender?.login || '') },
    };
    return { eventName: 'pull_request', payload: p };
  }

  return null;
}
