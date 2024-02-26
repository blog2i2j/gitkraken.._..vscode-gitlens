import { defineGkElement, Popover } from '@gitkraken/shared-web-components';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { State, Wip } from '../../../commitDetails/protocol';
import type { TreeItemAction, TreeItemBase } from '../../shared/components/tree/base';
import type { File } from './gl-details-base';
import { GlDetailsBase } from './gl-details-base';
import '../../shared/components/panes/pane-group';
import '../../shared/components/pills/tracking';

@customElement('gl-wip-details')
export class GlWipDetails extends GlDetailsBase {
	override readonly tab = 'wip';

	@property({ type: Object })
	wip?: Wip;

	@property({ type: Object })
	orgSettings?: State['orgSettings'];

	constructor() {
		super();

		defineGkElement(Popover);
	}

	renderShareTop() {
		const branch = this.wip?.branch;
		const filesCount = this.files?.length ?? 0;

		if (branch?.upstream == null || branch.upstream.missing === true) {
			return html`<div class="section">
				<p class="button-container">
					<span class="button-group button-group--single">
						<gl-button full data-action="publish-branch">
							<code-icon icon="cloud-upload"></code-icon> Publish Branch
						</gl-button>
						${when(
							this.orgSettings?.drafts === true && filesCount > 0,
							() => html`
								<gl-button density="compact" data-action="create-patch" title="Share as Cloud Patch">
									<code-icon icon="gl-cloud-patch-share"></code-icon>
								</gl-button>
							`,
						)}
					</span>
				</p>
			</div>`;
		}

		if (this.orgSettings?.drafts !== true) return undefined;

		let label = 'Share as Cloud Patch';
		let action = 'create-patch';
		const pr = this.wip?.pullRequest;
		if (pr != null) {
			if (pr.author.name.endsWith('(you)')) {
				label = 'Share with PR Participants';
				action = 'create-patch';
			} else {
				label = 'Share Suggested Changes';
				action = 'create-patch';
			}
		}

		return html`<div class="section">
			<p class="button-container">
				<span class="button-group button-group--single">
					<gl-button full data-action="${action}">
						<code-icon icon="gl-cloud-patch-share"></code-icon> ${label}
					</gl-button>
				</span>
			</p>
			${when(
				pr == null,
				() =>
					html` <p class="button-container">
						<span class="button-group button-group--single">
							<gl-button full appearance="secondary" data-action="create-pr">
								<code-icon icon="git-pull-request"></code-icon> Create Pull Request
							</gl-button>
						</span>
					</p>`,
			)}
		</div>`;
	}

	renderShare() {
		const branch = this.wip?.branch;
		if (branch?.upstream == null || branch.upstream.missing === true) {
			return html`<webview-pane expanded>
				<span slot="title">Share</span>
				<div class="section">
					<p class="button-container">
						<span class="button-group button-group--single">
							<gl-button full data-action="publish-branch">
								<code-icon icon="cloud-upload"></code-icon> Publish Branch
							</gl-button>
							${when(
								this.orgSettings?.drafts === true,
								() => html`
									<gl-button
										density="compact"
										data-action="create-patch"
										title="Share as Cloud Patch"
									>
										<code-icon icon="gl-cloud-patch-share"></code-icon>
									</gl-button>
								`,
							)}
						</span>
					</p>
				</div>
			</webview-pane>`;
		}

		if (this.orgSettings?.drafts !== true) return undefined;

		let label = 'Share as Cloud Patch';
		let action = 'create-patch';
		const pr = this.wip?.pullRequest;
		if (pr != null) {
			if (pr.author.name.endsWith('(you)')) {
				label = 'Share with PR Participants';
				action = 'create-patch';
			} else {
				label = 'Share Suggested Changes';
				action = 'create-patch';
			}
		}

		return html`<webview-pane expanded>
			<span slot="title" hidden>Share</span>
			<div class="section">
				<p class="button-container">
					<span class="button-group button-group--single">
						<gl-button full data-action="${action}">
							<code-icon icon="gl-cloud-patch-share"></code-icon> ${label}
						</gl-button>
					</span>
				</p>
				${when(
					pr == null,
					() =>
						html` <p class="button-container">
							<span class="button-group button-group--single">
								<gl-button full appearance="secondary" data-action="create-pr">
									<code-icon icon="git-pull-request"></code-icon> Create Pull Request
								</gl-button>
							</span>
						</p>`,
				)}
			</div>
		</webview-pane>`;
	}

	renderRepoState() {
		// || this.wip.repositoryCount < 2
		if (this.wip == null) return nothing;

		const changes = this.wip.changes;
		if (changes == null) return nothing;

		return html`
			<div class="top-details__actionbar top-details__actionbar--selector">
				<div class="top-details__actionbar-group top-details__actionbar-group--selector">
					<span class="top-details__actionbar--highlight">${changes.repository.name}</span>
				</div>
			</div>
		`;
	}

	renderBranchState() {
		if (this.wip == null) return nothing;

		const changes = this.wip.changes;
		const branch = this.wip.branch;
		if (changes == null || branch == null) return nothing;

		const ahead = branch.tracking?.ahead ?? 0;
		const behind = branch.tracking?.behind ?? 0;

		const fetchLabel = behind > 0 ? 'Pull' : ahead > 0 ? 'Push' : 'Fetch';
		const fetchIcon = behind > 0 ? 'arrow-down' : ahead > 0 ? 'arrow-up' : 'sync';

		return html`
			<div class="top-details__actionbar top-details__actionbar--selector">
				<div class="top-details__actionbar-group top-details__actionbar-group--selector">
					<a href="#" class="commit-action"
						>&nbsp;${branch.name}<code-icon icon="chevron-down"></code-icon
					></a>
					${when(
						this.wip.pullRequest != null,
						() =>
							html`<gk-popover placement="bottom" class="top-details__actionbar-pr">
								<a href="#" class="commit-action top-details__actionbar--pr" slot="trigger"
									><code-icon icon="git-pull-request"></code-icon
									><span>#${this.wip!.pullRequest!.id}</span></a
								>
								<div class="popover-content">
									<issue-pull-request
										type="pr"
										name="${this.wip!.pullRequest!.title}"
										url="${this.wip!.pullRequest!.url}"
										key="#${this.wip!.pullRequest!.id}"
										status="${this.wip!.pullRequest!.state}"
										.date=${this.wip!.pullRequest!.date}
									></issue-pull-request>
								</div>
							</gk-popover>`,
					)}
					<code-icon icon="chevron-right"></code-icon>
					<a href="#" class="commit-action">
						<code-icon icon="${fetchIcon}"></code-icon> ${fetchLabel}&nbsp;
						<gl-tracking-pill .ahead=${ahead} .behind=${behind}></gl-tracking-pill>
					</a>
				</div>
			</div>
		`;
	}

	renderBranchDetails() {
		let branchName = '';
		if (this.wip?.changes != null) {
			branchName =
				this.wip.repositoryCount > 1
					? `${this.wip.changes.repository.name}:${this.wip.changes.branchName}`
					: this.wip.changes.branchName;
		}

		const pr = this.wip?.pullRequest;
		return html`<webview-pane collapsable>
			<span slot="title">${branchName}</span>
			<action-nav slot="actions">
				<action-item
					data-action="commit-actions"
					data-action-type="scm"
					label="Open SCM view"
					icon="source-control"
				></action-item>
				<action-item
					data-action="commit-actions"
					data-action-type="graph"
					label="Open in Commit Graph"
					icon="gl-graph"
				></action-item>
			</action-nav>
			<div class="section">
				<p hidden>
					${when(
						this.wip?.changes == null || this.files == null,
						() => 'Loading...',
						() =>
							html`<span
								class="top-details__actionbar--highlight"
								title="${this.wip!.repositoryCount > 1
									? `${this.wip!.changes!.repository.name}:${this.wip!.changes!.branchName}`
									: this.wip!.changes!.branchName}"
								>${this.wip!.repositoryCount > 1
									? `${this.wip!.changes!.repository.name}:${this.wip!.changes!.branchName}`
									: this.wip!.changes!.branchName}</span
							>`,
					)}
				</p>
				${when(
					pr != null,
					() => html`
						<issue-pull-request
							type="pr"
							name="${pr!.title}"
							url="${pr!.url}"
							key="#${pr!.id}"
							status="${pr!.state}"
							.date=${pr!.date}
						></issue-pull-request>
					`,
				)}
			</div>
		</webview-pane>`;
	}

	override render() {
		if (this.wip == null) return nothing;

		return html`
			${this.renderRepoState()}${this.renderBranchState()}${this.renderShareTop()}
			<div class="top-details">
				<div class="top-details__top-menu">
					<div class="top-details__actionbar" hidden>
						<div class="top-details__actionbar-group">
							${when(
								this.wip?.changes == null || this.files == null,
								() => html`<span>Loading...</span>`,
								() =>
									html`<span
										class="top-details__actionbar--highlight"
										title="${this.wip!.repositoryCount > 1
											? `${this.wip!.changes!.repository.name}:${this.wip!.changes!.branchName}`
											: this.wip!.changes!.branchName}"
										>${this.wip!.repositoryCount > 1
											? `${this.wip!.changes!.repository.name}:${this.wip!.changes!.branchName}`
											: this.wip!.changes!.branchName}</span
									>`,
							)}
							${when(
								this.wip?.pullRequest != null,
								() =>
									html`<gk-popover placement="bottom" class="top-details__actionbar-pr">
										<a
											href="#"
											class="top-details__actionbar--highlight top-details__actionbar--pr"
											slot="trigger"
											><code-icon icon="git-pull-request"></code-icon
											><span>#${this.wip?.pullRequest?.id}</span></a
										>
										<div class="popover-content">
											<issue-pull-request
												type="pr"
												name="${this.wip!.pullRequest!.title}"
												url="${this.wip!.pullRequest!.url}"
												key="#${this.wip!.pullRequest!.id}"
												status="${this.wip!.pullRequest!.state}"
												.date=${this.wip!.pullRequest!.date}
											></issue-pull-request>
										</div>
									</gk-popover>`,
							)}
						</div>
						<div class="top-details__actionbar-group">
							<!-- <a
								class="commit-action"
								href="#"
								data-action="commit-actions"
								data-action-type="scm"
								aria-label="Open SCM view"
								title="Open SCM view"
								><code-icon icon="source-control"></code-icon
							></a> -->
							<a
								class="commit-action"
								href="#"
								data-action="commit-actions"
								data-action-type="graph"
								aria-label="Open in Commit Graph"
								title="Open in Commit Graph"
								><code-icon icon="gl-graph"></code-icon
							></a>
						</div>
					</div>
				</div>
			</div>
			<webview-pane-group flexible>${this.renderChangedFiles('wip')}${this.renderShare()}</webview-pane-group>
		`;
	}

	override getFileActions(file: File, _options?: Partial<TreeItemBase>): TreeItemAction[] {
		const openFile = {
			icon: 'go-to-file',
			label: 'Open file',
			action: 'file-open',
		};
		if (file.staged === true) {
			return [openFile, { icon: 'remove', label: 'Unstage changes', action: 'file-unstage' }];
		}
		return [openFile, { icon: 'plus', label: 'Stage changes', action: 'file-stage' }];
	}
}
