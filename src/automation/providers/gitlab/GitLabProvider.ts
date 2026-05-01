import type { NormalizedComment } from '../../core/types.js';
import { ISSUE_LIST_MAX_PAGES, ISSUE_LIST_PER_PAGE } from '../../util/pagination.js';
import type { DeliveryProvider, IssueSummary } from '../types.js';

export class GitLabProvider implements DeliveryProvider {
  readonly name = 'gitlab' as const;

  constructor(
    private readonly token: string,
    private readonly projectId: string,
    private readonly apiBase = 'https://gitlab.com/api/v4',
    private readonly useBearerAuth = false
  ) {
    if (!projectId) throw new Error('GitLab provider requires project id');
  }

  private url(path: string): string {
    const enc = encodeURIComponent(this.projectId);
    return `${this.apiBase}/projects/${enc}${path}`;
  }

  private authHeaders(json = false): HeadersInit {
    const h: Record<string, string> = this.useBearerAuth
      ? { Authorization: `Bearer ${this.token}` }
      : { 'PRIVATE-TOKEN': this.token };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async listIssueComments(issueNumber: number): Promise<NormalizedComment[]> {
    const res = await fetch(this.url(`/issues/${issueNumber}/notes?per_page=100`), {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`GitLab list notes: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { body?: string; author?: { username?: string } }[];
    return data.map((n) => ({
      body: n.body || '',
      authorLogin: n.author?.username || '',
    }));
  }

  async createComment(issueNumber: number, body: string): Promise<void> {
    const res = await fetch(this.url(`/issues/${issueNumber}/notes`), {
      method: 'POST',
      headers: this.authHeaders(true),
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error(`GitLab create note: ${res.status} ${await res.text()}`);
  }

  async createIssue(opts: { title: string; body: string; labels: string[] }): Promise<void> {
    const res = await fetch(this.url('/issues'), {
      method: 'POST',
      headers: this.authHeaders(true),
      body: JSON.stringify({
        title: opts.title,
        description: opts.body,
        labels: opts.labels.join(','),
      }),
    });
    if (!res.ok) throw new Error(`GitLab create issue: ${res.status} ${await res.text()}`);
  }

  async updateIssue(
    issueNumber: number,
    opts: { body?: string; state?: 'closed' }
  ): Promise<void> {
    const payload: Record<string, string> = {};
    if (opts.body !== undefined) payload.description = opts.body;
    if (opts.state === 'closed') payload.state_event = 'close';
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      method: 'PUT',
      headers: this.authHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`GitLab update issue: ${res.status} ${await res.text()}`);
  }

  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    if (labels.length === 0) return;
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      method: 'PUT',
      headers: this.authHeaders(true),
      body: JSON.stringify({ add_labels: labels.join(',') }),
    });
    if (!res.ok) throw new Error(`GitLab add labels: ${res.status} ${await res.text()}`);
  }

  async removeLabel(issueNumber: number, label: string): Promise<void> {
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      method: 'PUT',
      headers: this.authHeaders(true),
      body: JSON.stringify({ remove_labels: label }),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`GitLab remove label: ${res.status} ${await res.text()}`);
    }
  }

  async getIssue(
    issueNumber: number
  ): Promise<{ body: string; title: string; state: string } | null> {
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      headers: this.authHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitLab get issue: ${res.status} ${await res.text()}`);
    const j = (await res.json()) as { description?: string; title?: string; state?: string };
    return {
      body: j.description || '',
      title: j.title || '',
      state: j.state === 'opened' ? 'open' : 'closed',
    };
  }

  async listIssuesForBurnDown(): Promise<IssueSummary[]> {
    const out: IssueSummary[] = [];
    for (let page = 1; page <= ISSUE_LIST_MAX_PAGES; page++) {
      const res = await fetch(
        this.url(
          `/issues?per_page=${ISSUE_LIST_PER_PAGE}&state=all&page=${page}`
        ),
        { headers: this.authHeaders() }
      );
      if (!res.ok) throw new Error(`GitLab list issues: ${res.status} ${await res.text()}`);
      const arr = (await res.json()) as {
        iid: number;
        state: string;
        description?: string | null;
        title?: string;
      }[];
      if (arr.length === 0) break;
      for (const i of arr) {
        out.push({
          number: i.iid,
          state: i.state === 'opened' ? 'open' : 'closed',
          body: i.description || '',
          title: i.title || '',
        });
      }
      if (arr.length < ISSUE_LIST_PER_PAGE) break;
    }
    return out;
  }

  async setAssignees(issueNumber: number, logins: string[]): Promise<void> {
    const ids: number[] = [];
    for (const login of logins) {
      const u = await fetch(`${this.apiBase}/users?username=${encodeURIComponent(login)}`, {
        headers: this.authHeaders(),
      });
      if (!u.ok) continue;
      const arr = (await u.json()) as { id: number }[];
      if (arr[0]) ids.push(arr[0].id);
    }
    const res = await fetch(this.url(`/issues/${issueNumber}`), {
      method: 'PUT',
      headers: this.authHeaders(true),
      body: JSON.stringify({ assignee_ids: ids }),
    });
    if (!res.ok) throw new Error(`GitLab set assignees: ${res.status} ${await res.text()}`);
  }

  async ensureLabel(name: string, color: string): Promise<void> {
    const res = await fetch(this.url('/labels'), {
      method: 'POST',
      headers: this.authHeaders(true),
      body: JSON.stringify({
        name,
        color: color.replace(/^#/, ''),
      }),
    });
    if (res.ok) return;
    const text = await res.text();
    if (res.status === 409 || /already exists/i.test(text)) return;
    throw new Error(`GitLab create label: ${res.status} ${text}`);
  }
}
