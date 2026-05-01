import type { NormalizedComment } from '../../core/types.js';
import { ISSUE_LIST_MAX_PAGES, ISSUE_LIST_PER_PAGE } from '../../util/pagination.js';
import type { DeliveryProvider, IssueSummary } from '../types.js';

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export class GitHubProvider implements DeliveryProvider {
  readonly name = 'github' as const;

  private readonly token: string;

  private readonly owner: string;

  private readonly repo: string;

  constructor(token: string, repoFullName: string, private readonly apiBase = 'https://api.github.com') {
    this.token = token;
    const parts = repoFullName.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid GitHub repo fullName "${repoFullName}" (expected owner/repo)`);
    }
    [this.owner, this.repo] = parts;
  }

  private url(path: string): string {
    return `${this.apiBase}/repos/${this.owner}/${this.repo}${path}`;
  }

  async listIssueComments(issueNumber: number): Promise<NormalizedComment[]> {
    const res = await fetch(this.url(`/issues/${issueNumber}/comments`), {
      headers: authHeaders(this.token),
    });
    if (!res.ok) throw new Error(`GitHub list comments: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { body?: string; user?: { login?: string } }[];
    return data.map((c) => ({
      body: c.body || '',
      authorLogin: c.user?.login || '',
    }));
  }

  async createComment(issueNumber: number, body: string): Promise<void> {
    const res = await fetch(this.url(`/issues/${issueNumber}/comments`), {
      method: 'POST',
      headers: { ...authHeaders(this.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error(`GitHub create comment: ${res.status} ${await res.text()}`);
  }

  async createIssue(opts: { title: string; body: string; labels: string[] }): Promise<void> {
    const res = await fetch(this.url('/issues'), {
      method: 'POST',
      headers: { ...authHeaders(this.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: opts.title,
        body: opts.body,
        labels: opts.labels,
      }),
    });
    if (!res.ok) throw new Error(`GitHub create issue: ${res.status} ${await res.text()}`);
  }

  async updateIssue(
    issueNumber: number,
    opts: { body?: string; state?: 'closed' }
  ): Promise<void> {
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      method: 'PATCH',
      headers: { ...authHeaders(this.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...opts }),
    });
    if (!res.ok) throw new Error(`GitHub update issue: ${res.status} ${await res.text()}`);
  }

  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    const res = await fetch(this.url(`/issues/${issueNumber}/labels`), {
      method: 'POST',
      headers: { ...authHeaders(this.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ labels }),
    });
    if (!res.ok) throw new Error(`GitHub add labels: ${res.status} ${await res.text()}`);
  }

  async removeLabel(issueNumber: number, label: string): Promise<void> {
    const enc = encodeURIComponent(label);
    const res = await fetch(this.url(`/issues/${issueNumber}/labels/${enc}`), {
      method: 'DELETE',
      headers: authHeaders(this.token),
    });
    if (res.status === 404) return;
    if (!res.ok) throw new Error(`GitHub remove label: ${res.status} ${await res.text()}`);
  }

  async getIssue(
    issueNumber: number
  ): Promise<{ body: string; title: string; state: string } | null> {
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      headers: authHeaders(this.token),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub get issue: ${res.status} ${await res.text()}`);
    const j = (await res.json()) as { body?: string; title?: string; state?: string };
    return {
      body: j.body || '',
      title: j.title || '',
      state: j.state || 'open',
    };
  }

  async listIssuesForBurnDown(): Promise<IssueSummary[]> {
    const out: IssueSummary[] = [];
    for (let page = 1; page <= ISSUE_LIST_MAX_PAGES; page++) {
      const res = await fetch(
        `${this.url('/issues')}?state=all&per_page=${ISSUE_LIST_PER_PAGE}&page=${page}`,
        { headers: authHeaders(this.token) }
      );
      if (!res.ok) throw new Error(`GitHub list issues: ${res.status} ${await res.text()}`);
      const arr = (await res.json()) as {
        number: number;
        state: string;
        body?: string | null;
        title?: string;
        pull_request?: unknown;
      }[];
      if (arr.length === 0) break;
      for (const i of arr) {
        if (i.pull_request) continue;
        out.push({
          number: i.number,
          state: i.state === 'open' ? 'open' : 'closed',
          body: i.body || '',
          title: i.title || '',
        });
      }
      if (arr.length < ISSUE_LIST_PER_PAGE) break;
    }
    return out;
  }

  async setAssignees(issueNumber: number, logins: string[]): Promise<void> {
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      method: 'PATCH',
      headers: { ...authHeaders(this.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignees: logins }),
    });
    if (!res.ok) throw new Error(`GitHub set assignees: ${res.status} ${await res.text()}`);
  }

  async ensureLabel(name: string, color: string): Promise<void> {
    const res = await fetch(this.url('/labels'), {
      method: 'POST',
      headers: { ...authHeaders(this.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: color.replace(/^#/, '') }),
    });
    if (res.ok) return;
    const text = await res.text();
    if (res.status === 422 && /already exists/i.test(text)) return;
    throw new Error(`GitHub create label: ${res.status} ${text}`);
  }
}
