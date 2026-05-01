import type { NormalizedComment, ProviderName } from '../core/types.js';

export interface IssueSummary {
  number: number;
  state: 'open' | 'closed';
  body: string;
  title: string;
}

export interface DeliveryProvider {
  readonly name: ProviderName;

  listIssueComments(issueNumber: number): Promise<NormalizedComment[]>;

  createComment(issueNumber: number, body: string): Promise<void>;

  createIssue(opts: { title: string; body: string; labels: string[] }): Promise<void>;

  updateIssue(issueNumber: number, opts: { body?: string; state?: 'closed' }): Promise<void>;

  addLabels(issueNumber: number, labels: string[]): Promise<void>;

  removeLabel(issueNumber: number, label: string): Promise<void>;

  getIssue(issueNumber: number): Promise<{ body: string; title: string; state: string } | null>;

  /** Same semantics as legacy: single page, max 100 items, issues only where applicable. */
  listIssuesForBurnDown(): Promise<IssueSummary[]>;

  setAssignees(issueNumber: number, logins: string[]): Promise<void>;

  ensureLabel(name: string, color: string): Promise<void>;
}
