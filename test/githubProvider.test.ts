import { describe, it, expect, vi, afterEach } from 'vitest';
import { GitHubProvider } from '../src/automation/providers/github/GitHubProvider.js';

describe('GitHubProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createIssue sends POST with labels', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ number: 1 }), { status: 201 }))
    );
    vi.stubGlobal('fetch', fetchMock);

    const p = new GitHubProvider('token', 'owner/repo');
    await p.createIssue({ title: 'T', body: 'B', labels: ['sprint-active'] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as { body: string }).body);
    expect(body.title).toBe('T');
    expect(body.labels).toEqual(['sprint-active']);
  });
});
