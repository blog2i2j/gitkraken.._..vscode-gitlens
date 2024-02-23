import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { State } from '../../../commitDetails/protocol';
import { commitActionStyles } from './commit-action.css';

@customElement('gl-status-nav')
export class GlStatusNav extends LitElement {
	static override styles = [commitActionStyles, css``];

	override render() {
		return html`<div></div>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'gl-status-nav': GlStatusNav;
	}
}
