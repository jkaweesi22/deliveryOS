import { describe, expect, it } from 'vitest';
import { evaluateDualApproval } from '../src/automation/core/approvals/evaluateDualApproval.js';
import { parseSprintFeatures } from '../src/automation/core/sprint/parseSprintFeatures.js';
import { parseParentSprintNumber } from '../src/automation/core/sprint/parentSprintNumber.js';
import {
  parseSprintDates,
  timeElapsedPercent,
} from '../src/automation/core/sprint/sprintDates.js';
import { computeSprintHealth } from '../src/automation/core/sprint/burnDown.js';
import { buildTelegramMessage } from '../src/automation/core/notify/telegramMessage.js';

describe('parseSprintFeatures', () => {
  it('parses lines under Sprint Features section', () => {
    const body = `## x\n### Sprint Features\n\nFeature A\nFeature B\n\n### Other\n`;
    expect(parseSprintFeatures(body)).toEqual(['Feature A', 'Feature B']);
  });
});

describe('parseParentSprintNumber', () => {
  it('extracts parent sprint from marker line', () => {
    expect(parseParentSprintNumber('Parent Sprint: #42\n')).toBe(42);
    expect(parseParentSprintNumber('no marker')).toBeNull();
  });
});

describe('evaluateDualApproval', () => {
  it('returns declined when release approver declines', () => {
    const out = evaluateDualApproval(
      [{ body: 'declined - not ready', authorLogin: 'rel' }],
      'rel',
      'qa'
    );
    expect(out.kind).toBe('declined');
  });

  it('returns authorized when both approved', () => {
    const out = evaluateDualApproval(
      [
        { body: 'Approved', authorLogin: 'rel' },
        { body: 'QA approved', authorLogin: 'qa' },
      ],
      'rel',
      'qa'
    );
    expect(out.kind).toBe('authorized');
  });

  it('returns noop when incomplete', () => {
    const out = evaluateDualApproval(
      [{ body: 'Approved', authorLogin: 'rel' }],
      'rel',
      'qa'
    );
    expect(out.kind).toBe('noop');
  });
});

describe('sprint dates', () => {
  it('parses Sprint Dates range', () => {
    const body = `Sprint Dates:\n2026-01-01 to 2026-01-14`;
    const r = parseSprintDates(body);
    expect(r).not.toBeNull();
    expect(r!.start.getUTCFullYear()).toBe(2026);
    expect(r!.start.getUTCMonth()).toBe(0);
    expect(r!.start.getUTCDate()).toBe(1);
  });

  it('computes time percent', () => {
    const s = new Date('2026-01-01T00:00:00.000Z');
    const e = new Date('2026-01-10T00:00:00.000Z');
    const mid = new Date('2026-01-05T00:00:00.000Z');
    const p = timeElapsedPercent(s, e, mid);
    expect(p).toBeGreaterThan(40);
    expect(p).toBeLessThan(50);
  });
});

describe('burnDown', () => {
  it('appends sprint status section', () => {
    const body = '# Sprint';
    const range = {
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-10T00:00:00.000Z'),
    };
    const now = new Date('2026-01-05T00:00:00.000Z');
    const h = computeSprintHealth(body, range, 5, 10, now);
    expect(h.progressPercent).toBe(50);
    expect(h.updatedBody).toContain('## 🚦 Sprint Status');
  });
});

describe('telegram templates', () => {
  it('builds bug opened message', () => {
    const text = buildTelegramMessage({
      eventName: 'issues',
      eventAction: 'opened',
      actor: 'dev',
      issue: {
        title: 'T',
        htmlUrl: 'https://x',
        labels: ['bug'],
      },
      releaseApprover: 'rel',
      timestamp: 'now',
    });
    expect(text).toContain('BUG OPENED');
  });

  it('reports PR merged when base matches configured default branch', () => {
    const text = buildTelegramMessage({
      eventName: 'pull_request',
      eventAction: 'closed',
      actor: 'dev',
      releaseApprover: 'rel',
      timestamp: 'now',
      defaultBranch: 'develop',
      pullRequest: {
        merged: true,
        baseRef: 'develop',
        title: 'Ship it',
        htmlUrl: 'https://git/y',
      },
    });
    expect(text).toContain('PR MERGED');
    expect(text).toContain('Ship it');
  });
});
