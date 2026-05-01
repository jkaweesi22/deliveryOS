import { describe, it, expect, vi, afterEach } from 'vitest';
import { ISSUE_LIST_PER_PAGE } from '../src/automation/util/pagination.js';
import { GitLabProvider } from '../src/automation/providers/gitlab/GitLabProvider.js';

describe('GitLabProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses PRIVATE-TOKEN by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const p = new GitLabProvider('secret', '1');
    await p.listIssuesForBurnDown();

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as { headers: HeadersInit }).headers as Record<string, string>;
    expect(headers['PRIVATE-TOKEN']).toBe('secret');
    expect(headers.Authorization).toBeUndefined();
  });

  it('uses Bearer when useBearerAuth is true', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const p = new GitLabProvider('oauth', '1', 'https://gitlab.com/api/v4', true);
    await p.listIssueComments(1);

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as { headers: HeadersInit }).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer oauth');
    expect(headers['PRIVATE-TOKEN']).toBeUndefined();
  });

  it('listIssuesForBurnDown fetches multiple pages until short page', async () => {
    const page1 = Array.from({ length: ISSUE_LIST_PER_PAGE }, (_, i) => ({
      iid: i + 1,
      state: 'opened',
      title: `t${i}`,
      description: '',
    }));
    const page2 = [{ iid: 101, state: 'opened', title: 'last', description: '' }];

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const page = new URL(url, 'https://dummy.test').searchParams.get('page');
      if (page === '1') {
        return Promise.resolve(new Response(JSON.stringify(page1), { status: 200 }));
      }
      if (page === '2') {
        return Promise.resolve(new Response(JSON.stringify(page2), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const p = new GitLabProvider('t', '123');
    const issues = await p.listIssuesForBurnDown();

    expect(issues.length).toBe(ISSUE_LIST_PER_PAGE + 1);
    expect(fetchMock.mock.calls.length).toBe(2);
    const u0 = fetchMock.mock.calls[0][0] as string;
    expect(u0).toContain('page=1');
    expect(u0).toContain(`per_page=${ISSUE_LIST_PER_PAGE}`);
  });
});
