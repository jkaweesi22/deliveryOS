import type { NormalizedComment } from '../../core/types.js';
import type { DeliveryProvider, IssueSummary } from '../types.js';

export class BitbucketProviderStub implements DeliveryProvider {
  readonly name = 'bitbucket' as const;

  private err(op: string): Error {
    return new Error(
      `Bitbucket provider is not implemented yet (${op}). See docs/PROVIDER_MATRIX.md.`
    );
  }

  async listIssueComments(): Promise<NormalizedComment[]> {
    throw this.err('listIssueComments');
  }

  async createComment(): Promise<void> {
    throw this.err('createComment');
  }

  async createIssue(): Promise<void> {
    throw this.err('createIssue');
  }

  async updateIssue(): Promise<void> {
    throw this.err('updateIssue');
  }

  async addLabels(): Promise<void> {
    throw this.err('addLabels');
  }

  async removeLabel(): Promise<void> {
    throw this.err('removeLabel');
  }

  async getIssue(): Promise<{ body: string; title: string; state: string } | null> {
    throw this.err('getIssue');
  }

  async listIssuesForBurnDown(): Promise<IssueSummary[]> {
    throw this.err('listIssuesForBurnDown');
  }

  async setAssignees(): Promise<void> {
    throw this.err('setAssignees');
  }

  async ensureLabel(): Promise<void> {
    throw this.err('ensureLabel');
  }
}
