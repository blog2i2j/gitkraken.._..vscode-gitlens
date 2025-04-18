import type { AuthenticationSession } from 'vscode';
import type { IntegrationId, SupportedCloudIntegrationIds } from '../../../constants.integrations';
import {
	HostingIntegrationId,
	IssueIntegrationId,
	SelfHostedIntegrationId,
	supportedOrderedCloudIntegrationIds,
	supportedOrderedCloudIssueIntegrationIds,
} from '../../../constants.integrations';
import { configuration } from '../../../system/-webview/configuration';

export interface ProviderAuthenticationSession extends AuthenticationSession {
	readonly cloud: boolean;
	readonly expiresAt?: Date;
	readonly domain: string;
	readonly protocol?: string;
}

export interface ConfiguredIntegrationDescriptor {
	readonly cloud: boolean;
	readonly integrationId: IntegrationId;
	readonly scopes: string;
	readonly domain?: string;
	readonly expiresAt?: string | Date;
}

export interface CloudIntegrationAuthenticationSession {
	type: CloudIntegrationAuthType;
	accessToken: string;
	domain: string;
	expiresIn: number;
	scopes: string;
}

export interface CloudIntegrationAuthorization {
	url: string;
}

export interface CloudIntegrationConnection {
	type: CloudIntegrationAuthType;
	provider: CloudIntegrationType;
	domain: string;
}

export type CloudIntegrationType =
	| 'jira'
	| 'trello'
	| 'gitlab'
	| 'github'
	| 'bitbucket'
	| 'bitbucketServer'
	| 'azure'
	| 'githubEnterprise'
	| 'gitlabSelfHosted';

export type CloudIntegrationAuthType = 'oauth' | 'pat';

export const CloudIntegrationAuthenticationUriPathPrefix = 'did-authenticate-cloud-integration';

export function getSupportedCloudIntegrationIds(): SupportedCloudIntegrationIds[] {
	return configuration.get('cloudIntegrations.enabled', undefined, true)
		? supportedOrderedCloudIntegrationIds
		: supportedOrderedCloudIssueIntegrationIds;
}

export function isSupportedCloudIntegrationId(id: string): id is SupportedCloudIntegrationIds {
	return getSupportedCloudIntegrationIds().includes(id as SupportedCloudIntegrationIds);
}

export const toIntegrationId: { [key in CloudIntegrationType]: IntegrationId } = {
	jira: IssueIntegrationId.Jira,
	trello: IssueIntegrationId.Trello,
	gitlab: HostingIntegrationId.GitLab,
	github: HostingIntegrationId.GitHub,
	githubEnterprise: SelfHostedIntegrationId.CloudGitHubEnterprise,
	gitlabSelfHosted: SelfHostedIntegrationId.CloudGitLabSelfHosted,
	bitbucket: HostingIntegrationId.Bitbucket,
	bitbucketServer: SelfHostedIntegrationId.BitbucketServer,
	azure: HostingIntegrationId.AzureDevOps,
};

export const toCloudIntegrationType: { [key in IntegrationId]: CloudIntegrationType | undefined } = {
	[IssueIntegrationId.Jira]: 'jira',
	[IssueIntegrationId.Trello]: 'trello',
	[HostingIntegrationId.GitLab]: 'gitlab',
	[HostingIntegrationId.GitHub]: 'github',
	[HostingIntegrationId.Bitbucket]: 'bitbucket',
	[HostingIntegrationId.AzureDevOps]: 'azure',
	[SelfHostedIntegrationId.CloudGitHubEnterprise]: 'githubEnterprise',
	[SelfHostedIntegrationId.CloudGitLabSelfHosted]: 'gitlabSelfHosted',
	[SelfHostedIntegrationId.BitbucketServer]: 'bitbucketServer',
	[SelfHostedIntegrationId.GitHubEnterprise]: undefined,
	[SelfHostedIntegrationId.GitLabSelfHosted]: undefined,
};
