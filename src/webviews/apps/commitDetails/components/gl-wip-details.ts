import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { PullRequestShape } from '../../../../git/models/pullRequest';
import { pluralize } from '../../../../system/string';
import type { State, Wip } from '../../../commitDetails/protocol';
import type { TreeItemAction, TreeItemBase } from '../../shared/components/tree/base';
import type { File } from './gl-details-base';
import { GlDetailsBase } from './gl-details-base';
import '../../shared/components/panes/pane-group';

@customElement('gl-wip-details')
export class GlWipDetails extends GlDetailsBase {
	override readonly tab = 'wip';

	@property({ type: Object })
	wip?: Wip;

	@property({ type: Object })
	wipPullRequest?: PullRequestShape;

	@property({ type: Object })
	orgSettings!: State['orgSettings'];

	renderShare() {
		if (this.orgSettings?.drafts === false) return undefined;

		let label = 'Share as Cloud Patch';
		let action = 'create-patch';
		const pr = this.wipPullRequest;
		if (pr != null) {
			if (this.wipPullRequest?.author.name.endsWith('(you)')) {
				label = 'Share with PR Participants';
				action = 'create-patch';
			} else {
				label = 'Share Suggested Changes';
				action = 'create-patch';
			}
		}

		return html`<webview-pane expanded>
			<span slot="title">Share</span>
			<div class="section">
				<p class="button-container">
					<span class="button-group button-group--single">
						<gl-button full data-action="${action}">
							<code-icon icon="gl-cloud-patch-share"></code-icon> ${label}
						</gl-button>
					</span>
				</p>
			</div>
		</webview-pane>`;
	}

	renderBranchDetails() {
		let branchName = '';
		if (this.wip?.changes != null) {
			branchName =
				this.wip.repositoryCount > 1
					? `${this.wip.changes.repository.name}:${this.wip.changes.branchName}`
					: this.wip.changes.branchName;
		}

		let changes = 'Loading...';
		if (this.files != null) {
			changes = pluralize('change', this.files.length);
		}

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
								>${pluralize('change', this.files!.length)} on
								<span
									class="top-details__actionbar--highlight"
									title="${this.wip!.repositoryCount > 1
										? `${this.wip!.changes!.repository.name}:${this.wip!.changes!.branchName}`
										: this.wip!.changes!.branchName}"
									>${this.wip!.repositoryCount > 1
										? `${this.wip!.changes!.repository.name}:${this.wip!.changes!.branchName}`
										: this.wip!.changes!.branchName}</span
								></span
							>`,
					)}
				</p>
				${when(
					this.wipPullRequest != null,
					() => html`
						<issue-pull-request
							type="pr"
							name="${this.wipPullRequest!.title}"
							url="${this.wipPullRequest!.url}"
							key="#${this.wipPullRequest!.id}"
							status="${this.wipPullRequest!.state}"
							.date=${this.wipPullRequest!.date}
						></issue-pull-request>
					`,
				)}
			</div>
		</webview-pane>`;
	}

	override render() {
		return html`
			<div class="top-details" hidden>
				<div class="top-details__top-menu">
					<div class="top-details__actionbar">
						<div class="top-details__actionbar-group">
							${when(
								this.wip?.changes == null || this.files == null,
								() => 'Loading...',
								() =>
									html`<span
										>${pluralize('change', this.files!.length)} on
										<span
											class="top-details__actionbar--highlight"
											title="${this.wip!.repositoryCount > 1
												? `${this.wip!.changes!.repository.name}:${
														this.wip!.changes!.branchName
												  }`
												: this.wip!.changes!.branchName}"
											>${this.wip!.repositoryCount > 1
												? `${this.wip!.changes!.repository.name}:${
														this.wip!.changes!.branchName
												  }`
												: this.wip!.changes!.branchName}</span
										></span
									>`,
							)}
						</div>
						<div class="top-details__actionbar-group">
							<a
								class="commit-action"
								href="#"
								data-action="commit-actions"
								data-action-type="scm"
								aria-label="Open SCM view"
								title="Open SCM view"
								><code-icon icon="source-control"></code-icon
							></a>
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
			<webview-pane-group flexible>
				${this.renderBranchDetails()}${this.renderChangedFiles('wip')}${this.renderShare()}
			</webview-pane-group>
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
