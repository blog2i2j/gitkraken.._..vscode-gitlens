import { defineGkElement, Popover } from '@gitkraken/shared-web-components';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { State } from '../../../commitDetails/protocol';
import { commitActionStyles } from './commit-action.css';

@customElement('gl-status-nav')
export class GlStatusNav extends LitElement {
	static override styles = [
		commitActionStyles,
		css`
			*,
			*::before,
			*::after {
				box-sizing: border-box;
			}

			:host {
				display: flex;
				flex-direction: row;
				/* flex-wrap: wrap; */
				align-items: center;
				justify-content: space-between;
			}

			.commit-action--overflowed {
				min-width: 0;
			}

			.branch {
				min-width: 0;
				max-width: fit-content;
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow: hidden;
			}

			.group {
				display: flex;
				flex: none;
				flex-direction: row;
				min-width: 0;
				max-width: 100%;
			}

			.group:first-child {
				min-width: 0;
				flex: 0 1 auto;
			}

			.popover-content {
				background-color: var(--color-background--level-15);
				padding: 0.8rem 1.2rem;
			}
		`,
	];

	@property({ type: Object })
	wip?: State['wip'];

	constructor() {
		super();

		defineGkElement(Popover);
	}

	override render() {
		if (this.wip == null) return nothing;

		const changes = this.wip.changes;
		const branch = this.wip.branch;
		if (changes == null || branch == null) return nothing;

		return html`
			<div class="group">
				${when(
					this.wip.pullRequest != null,
					() =>
						html`<gk-popover placement="bottom">
							<a href="#" class="commit-action" slot="trigger"
								><code-icon icon="git-pull-request" class="pr"></code-icon
								><span>#${this.wip!.pullRequest!.id}</span></a
							>
							<div class="popover-content">
								<issue-pull-request
									type="pr"
									name="${this.wip!.pullRequest!.title}"
									url="${this.wip!.pullRequest!.url}"
									key="#${this.wip!.pullRequest!.id}"
									status="${this.wip!.pullRequest!.state}"
									.date=${this.wip!.pullRequest!.updatedDate}
								></issue-pull-request>
							</div>
						</gk-popover>`,
				)}
				<a href="command:gitlens.views.switchToBranch" class="commit-action commit-action--overflowed">
					${when(this.wip.pullRequest == null, () => html`<code-icon icon="git-branch"></code-icon>`)}<span
						class="branch"
						>${branch.name}</span
					><code-icon icon="chevron-down" size="10"></code-icon
				></a>
			</div>
			<div class="group">
				<a href="command:gitlens.fetchRepositories" class="commit-action" title="Fetch"
					><code-icon icon="sync"></code-icon
				></a>
			</div>
		`;
	}

	onSwitchClick() {}

	onFetchClick() {}
}

declare global {
	interface HTMLElementTagNameMap {
		'gl-status-nav': GlStatusNav;
	}
}
