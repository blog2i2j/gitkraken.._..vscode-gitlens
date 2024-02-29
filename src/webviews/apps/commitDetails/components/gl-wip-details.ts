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

	get isUnpublished() {
		const branch = this.wip?.branch;
		return branch?.upstream == null || branch.upstream.missing === true;
	}

	get draftsEnabled() {
		return this.orgSettings?.drafts === true;
	}

	get filesCount() {
		return this.files?.length ?? 0;
	}

	get branchState() {
		const branch = this.wip?.branch;
		if (branch == null) return undefined;

		return {
			ahead: branch.tracking?.ahead ?? 0,
			behind: branch.tracking?.behind ?? 0,
		};
	}

	renderPrimaryAction() {
		if (this.draftsEnabled && this.filesCount > 0) {
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
			return html`<p class="button-container">
				<span class="button-group button-group--single">
					<gl-button full data-action="${action}">
						<code-icon icon="gl-cloud-patch-share"></code-icon> ${label}
					</gl-button>
				</span>
			</p>`;
		}

		if (this.isUnpublished) {
			return html`<p class="button-container">
				<span class="button-group button-group--single">
					<gl-button full data-action="publish-branch">
						<code-icon icon="cloud-upload"></code-icon> Publish Branch
					</gl-button>
				</span>
			</p>`;
		}

		if (this.branchState == null) return undefined;

		const { ahead, behind } = this.branchState;
		if (ahead === 0 && behind === 0) return undefined;

		const fetchLabel = behind > 0 ? 'Pull' : ahead > 0 ? 'Push' : 'Fetch';
		const fetchIcon = behind > 0 ? 'arrow-down' : ahead > 0 ? 'arrow-up' : 'sync';

		return html`<p class="button-container">
			<span class="button-group button-group--single">
				<gl-button full data-action="${fetchLabel.toLowerCase()}">
					<code-icon icon="${fetchIcon}"></code-icon> ${fetchLabel}&nbsp;
					<gl-tracking-pill .ahead=${ahead} .behind=${behind}></gl-tracking-pill>
				</gl-button>
			</span>
		</p>`;
	}

	renderSecondaryAction() {
		const canShare = this.draftsEnabled && this.filesCount > 0;
		if (this.isUnpublished && canShare) {
			return html`<p class="button-container">
				<span class="button-group button-group--single">
					<gl-button full appearance="secondary" data-action="publish-branch">
						<code-icon icon="cloud-upload"></code-icon> Publish Branch
					</gl-button>
				</span>
			</p>`;
		}

		if ((!this.isUnpublished && !canShare) || this.branchState == null) return undefined;

		const { ahead, behind } = this.branchState;
		if (ahead === 0 && behind === 0) return undefined;

		const fetchLabel = behind > 0 ? 'Pull' : ahead > 0 ? 'Push' : 'Fetch';
		const fetchIcon = behind > 0 ? 'arrow-down' : ahead > 0 ? 'arrow-up' : 'sync';

		return html`<p class="button-container">
			<span class="button-group button-group--single">
				<gl-button full appearance="secondary" data-action="${fetchLabel.toLowerCase()}">
					<code-icon icon="${fetchIcon}"></code-icon> ${fetchLabel}&nbsp;
					<gl-tracking-pill .ahead=${ahead} .behind=${behind}></gl-tracking-pill>
				</gl-button>
			</span>
		</p>`;
	}

	renderActions() {
		const primaryAction = this.renderPrimaryAction();
		const secondaryAction = this.renderSecondaryAction();
		if (primaryAction == null && secondaryAction == null) return nothing;

		return html`<div class="section section--actions">${primaryAction}${secondaryAction}</div>`;
	}

	renderActions2() {
		const branch = this.wip?.branch;
		const filesCount = this.files?.length ?? 0;

		if (branch?.upstream == null || branch.upstream.missing === true) {
			return html`<div class="section section--actions">
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

		return html`<div class="section section--actions">
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
					html`<p class="button-container">
						<span class="button-group button-group--single">
							<gl-button full appearance="secondary" data-action="create-pr">
								<code-icon icon="git-pull-request"></code-icon> Create Pull Request
							</gl-button>
						</span>
					</p>`,
			)}
		</div>`;
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

	override render() {
		if (this.wip == null) return nothing;

		return html`
			${this.renderActions()}
			<webview-pane-group flexible>${this.renderChangedFiles('wip')}</webview-pane-group>
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
