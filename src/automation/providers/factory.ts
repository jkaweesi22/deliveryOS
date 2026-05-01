import type { ProviderName, RuntimeConfig } from '../core/types.js';
import type { DeliveryProvider } from './types.js';
import { BitbucketProviderStub } from './bitbucket/stub.js';
import { CodebergProviderStub } from './codeberg/stub.js';
import { GitHubProvider } from './github/GitHubProvider.js';
import { GitLabProvider } from './gitlab/GitLabProvider.js';

export function createProvider(config: RuntimeConfig): DeliveryProvider {
  const { provider, token, apiBaseUrl, repoFullName, projectId, gitlabUseBearer } = config;

  switch (provider as ProviderName) {
    case 'github': {
      if (!repoFullName) {
        throw new Error('GitHub provider requires DELIVERY_OS_REPO or GITHUB_REPOSITORY');
      }
      return new GitHubProvider(token, repoFullName, apiBaseUrl || 'https://api.github.com');
    }
    case 'gitlab': {
      if (!projectId) {
        throw new Error('GitLab provider requires DELIVERY_OS_PROJECT_ID or CI_PROJECT_ID');
      }
      return new GitLabProvider(
        token,
        projectId,
        apiBaseUrl || 'https://gitlab.com/api/v4',
        Boolean(gitlabUseBearer)
      );
    }
    case 'bitbucket':
      return new BitbucketProviderStub();
    case 'codeberg':
      return new CodebergProviderStub();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
