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
				flex-wrap: wrap;
				align-items: center;
				justify-content: space-between;
			}

			.group {
				display: flex;
				flex: none;
				flex-direction: row;
				max-width: 100%;
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

		// const ahead = branch.tracking?.ahead ?? 0;
		// const behind = branch.tracking?.behind ?? 0;

		// const fetchLabel = behind > 0 ? 'Pull' : ahead > 0 ? 'Push' : 'Fetch';
		// const fetchIcon = behind > 0 ? 'arrow-down' : ahead > 0 ? 'arrow-up' : 'sync';

		return html`
			<div class="group">
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
									.date=${this.wip!.pullRequest!.updatedDate}
								></issue-pull-request>
							</div>
						</gk-popover>`,
				)}
				<a href="#" class="commit-action">
					${when(
						this.wip.pullRequest == null,
						() => html`<code-icon icon="git-branch"></code-icon>`,
					)}&nbsp;${branch.name}<code-icon icon="chevron-down"></code-icon
				></a>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'gl-status-nav': GlStatusNav;
	}
}
