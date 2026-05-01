import type { NormalizedComment } from '../types.js';

export type DualApprovalOutcome =
  | { kind: 'declined' }
  | { kind: 'authorized' }
  | { kind: 'noop' };

/**
 * Mirrors authorize-deployment.yml: scan all comments in order.
 * Decline takes precedence if release approver matches first matching decline pattern.
 */
export function evaluateDualApproval(
  comments: NormalizedComment[],
  releaseApprover: string,
  qaApprover: string
): DualApprovalOutcome {
  let releaseApproved = false;
  let qaApproved = false;

  for (const comment of comments) {
    const bodyLower = (comment.body || '').trim().toLowerCase();

    if (
      comment.authorLogin === releaseApprover &&
      /(declined|reject|not approved)/i.test(bodyLower)
    ) {
      return { kind: 'declined' };
    }

    if (
      comment.authorLogin === releaseApprover &&
      /^(approved|approve|ok|go ahead)/im.test(bodyLower)
    ) {
      releaseApproved = true;
    }

    if (
      comment.authorLogin === qaApprover &&
      /(qa approved|approved|qa ok|looks good)/i.test(bodyLower)
    ) {
      qaApproved = true;
    }
  }

  if (releaseApproved && qaApproved) return { kind: 'authorized' };
  return { kind: 'noop' };
}
