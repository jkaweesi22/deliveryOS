import { describe, expect, it, vi, afterEach } from 'vitest';
import { mapGlIssueAction, normalizeGitlabWebhook } from '../src/automation/normalize/gitlab.js';

describe('mapGlIssueAction', () => {
  it('maps open/close/reopen', () => {
    expect(mapGlIssueAction({}, { action: 'open' })).toBe('opened');
    expect(mapGlIssueAction({}, { action: 'close' })).toBe('closed');
    expect(mapGlIssueAction({}, { action: 'reopen' })).toBe('reopened');
  });

  it('maps update with label changes to labeled', () => {
    const raw = { changes: { labels: { previous: [], current: [] } } };
    expect(mapGlIssueAction(raw, { action: 'update' })).toBe('labeled');
  });

  it('maps generic update to updated', () => {
    expect(mapGlIssueAction({}, { action: 'update' })).toBe('updated');
  });
});

describe('normalizeGitlabWebhook', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CI_PROJECT_ID;
    delete process.env.DELIVERY_OS_PROJECT_ID;
  });

  const baseProject = {
    id: 99,
    path_with_namespace: 'g/p',
    web_url: 'https://gitlab.example/g/p',
  };

  it('normalizes merge_request merge to pull_request', () => {
    process.env.CI_PROJECT_ID = '99';
    const raw = {
      object_kind: 'merge_request',
      project: baseProject,
      user: { username: 'dev' },
      object_attributes: {
        action: 'merge',
        iid: 7,
        target_branch: 'main',
        title: 'Fix thing',
        url: 'https://gitlab.example/g/p/-/merge_requests/7',
      },
    };
    const w = normalizeGitlabWebhook('Merge Request Hook', raw);
    expect(w).not.toBeNull();
    expect(w!.eventName).toBe('pull_request');
    const p = w!.payload as import('../src/automation/core/types.js').PullRequestEventPayload;
    expect(p.pull_request.merged).toBe(true);
    expect(p.pull_request.base.ref).toBe('main');
    expect(p.pull_request.html_url).toContain('merge_requests/7');
  });

  it('returns null for merge_request non-merge actions', () => {
    process.env.CI_PROJECT_ID = '99';
    const raw = {
      object_kind: 'merge_request',
      project: baseProject,
      object_attributes: { action: 'open', iid: 1, target_branch: 'main', title: 'x' },
    };
    expect(normalizeGitlabWebhook('Merge Request Hook', raw)).toBeNull();
  });
});
