import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { State } from '../../../commitDetails/protocol';
import { commitActionStyles } from './commit-action.css';

@customElement('gl-inspect-nav')
export class GlInspectNav extends LitElement {
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

			:host([pinned]) {
				background-color: var(--color-alert-warningBackground);
				box-shadow: 0 0 0 0.1rem var(--color-alert-warningBorder);
				border-radius: 0.3rem;
			}

			:host([pinned]) .commit-action:hover,
			:host([pinned]) .commit-action.is-active {
				background-color: var(--color-alert-warningHoverBackground);
			}

			.group {
				display: flex;
				flex: none;
				flex-direction: row;
				max-width: 100%;
			}
		`,
	];

	@property({ type: Boolean, reflect: true })
	pinned = false;

	@property({ type: Boolean })
	uncommitted = false;

	@property({ type: Object })
	navigation?: State['navigationStack'];

	@property()
	shortSha = '';

	get navigationState() {
		if (this.navigation == null) {
			return {
				back: false,
				forward: false,
			};
		}

		const actions = {
			back: true,
			forward: true,
		};

		if (this.navigation.count <= 1) {
			actions.back = false;
			actions.forward = false;
		} else if (this.navigation.position === 0) {
			actions.back = true;
			actions.forward = false;
		} else if (this.navigation.position === this.navigation.count - 1) {
			actions.back = false;
			actions.forward = true;
		}

		return actions;
	}

	override render() {
		const pinLabel = this.pinned
			? 'Unpin this Commit\nRestores Automatic Following'
			: 'Pin this Commit\nSuspends Automatic Following';

		let forwardLabel = 'Forward';
		let backLabel = 'Back';
		if (this.navigation?.hint) {
			if (this.pinned) {
				forwardLabel += ` - ${this.navigation.hint}`;
			} else {
				backLabel = ` - ${this.navigation.hint}`;
			}
		}

		return html`
			<div class="group">
				${when(
					!this.uncommitted,
					() => html`
						<a
							class="commit-action"
							href="#"
							data-action="commit-actions"
							data-action-type="sha"
							aria-label="Copy SHA
[⌥] Pick Commit..."
							title="Copy SHA
[⌥] Pick Commit..."
						>
							<code-icon icon="git-commit"></code-icon>
							<span class="top-details__sha" data-region="shortsha">${this.shortSha}</span></a
						>
					`,
				)}
			</div>
			<div class="group">
				<a
					class="commit-action${this.pinned ? ' is-active' : ''}"
					href="#"
					data-action="pin"
					aria-label="${pinLabel}"
					title="${pinLabel}"
					><code-icon icon="${this.pinned ? 'gl-pinned-filled' : 'pin'}" data-region="commit-pin"></code-icon
				></a>
				<a
					class="commit-action${this.navigationState.back ? '' : ' is-disabled'}"
					aria-disabled="${this.navigationState.back ? 'false' : 'true'}"
					href="#"
					data-action="back"
					aria-label="${backLabel}"
					title="${backLabel}"
					><code-icon icon="arrow-left" data-region="commit-back"></code-icon
				></a>
				${when(
					this.navigationState.forward,
					() => html`
						<a
							class="commit-action"
							href="#"
							data-action="forward"
							aria-label="${forwardLabel}"
							title="${forwardLabel}"
							><code-icon icon="arrow-right" data-region="commit-forward"></code-icon
						></a>
					`,
				)}
				${when(
					this.navigation?.hint,
					() => html`
						<a
							class="commit-action commit-action--emphasis-low"
							href="#"
							title="View this Commit"
							data-action="${this.pinned ? 'forward' : 'back'}"
							><code-icon icon="git-commit"></code-icon
							><span data-region="commit-hint">${this.navigation!.hint}</span></a
						>
					`,
				)}
				<!-- TODO: add a spacer -->
				${when(
					this.uncommitted,
					() => html`
						<a
							class="commit-action"
							href="#"
							data-action="commit-actions"
							data-action-type="scm"
							aria-label="Open SCM view"
							title="Open SCM view"
							><code-icon icon="source-control"></code-icon
						></a>
					`,
				)}
				<a
					class="commit-action"
					href="#"
					data-action="commit-actions"
					data-action-type="graph"
					aria-label="Open in Commit Graph"
					title="Open in Commit Graph"
					><code-icon icon="gl-graph"></code-icon
				></a>
				${when(
					!this.uncommitted,
					() => html`
						<a
							class="commit-action"
							href="#"
							data-action="commit-actions"
							data-action-type="more"
							aria-label="Show Commit Actions"
							title="Show Commit Actions"
							><code-icon icon="kebab-vertical"></code-icon
						></a>
					`,
				)}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'gl-inspect-nav': GlInspectNav;
	}
}
