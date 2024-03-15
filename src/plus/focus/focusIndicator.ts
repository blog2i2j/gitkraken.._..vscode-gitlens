import type { ConfigurationChangeEvent, StatusBarItem, ThemeColor } from 'vscode';
import { Disposable, MarkdownString, StatusBarAlignment, window } from 'vscode';
import type { Container } from '../../container';
import { configuration } from '../../system/configuration';
import { groupByMap } from '../../system/iterable';
import { pluralize } from '../../system/string';
import type { FocusItem, FocusProvider, FocusRefreshEvent } from './focusProvider';
import { focusGroups, groupAndSortFocusItems } from './focusProvider';

export class FocusIndicator implements Disposable {
	private readonly _disposable: Disposable;

	private _statusBarFocus: StatusBarItem | undefined;

	private _refreshTimer: ReturnType<typeof setInterval> | undefined;

	constructor(
		private readonly container: Container,
		private readonly focus: FocusProvider,
	) {
		this._disposable = Disposable.from(
			focus.onDidRefresh(this.onFocusRefreshed, this),
			configuration.onDidChange(this.onConfigurationChanged, this),
		);
		this.onReady();
	}

	dispose() {
		this.clearRefreshTimer();
		this._statusBarFocus?.dispose();
		this._statusBarFocus = undefined!;
		this._disposable.dispose();
	}

	private onConfigurationChanged(e: ConfigurationChangeEvent) {
		if (!configuration.changed(e, 'focus.experimental.indicators')) return;

		if (configuration.changed(e, 'focus.experimental.indicators.openQuickFocus')) {
			this.updateStatusBarFocusCommand();
		}

		if (configuration.changed(e, 'focus.experimental.indicators.refreshRate')) {
			this.startRefreshTimer();
		}
	}

	private onFocusRefreshed(e: FocusRefreshEvent) {
		if (this._statusBarFocus == null) return;

		this.updateStatusBar(this._statusBarFocus, e.items);
	}

	private onReady(): void {
		if (!configuration.get('focus.experimental.indicators.enabled')) {
			return;
		}

		this._statusBarFocus = window.createStatusBarItem('gitlens.focus', StatusBarAlignment.Left, 10000 - 2);
		this._statusBarFocus.name = 'GitLens Focus';
		this._statusBarFocus.text = '$(loading~spin)';
		this._statusBarFocus.tooltip = 'Loading...';
		this.updateStatusBarFocusCommand();
		this._statusBarFocus.show();
		this.clearRefreshTimer();
		setTimeout(() => this.startRefreshTimer(), 5000);
	}

	private updateStatusBarFocusCommand() {
		if (this._statusBarFocus == null) return;

		this._statusBarFocus.command = configuration.get('focus.experimental.indicators.openQuickFocus')
			? 'gitlens.quickFocus'
			: 'gitlens.showFocusPage';
	}

	private startRefreshTimer() {
		const refreshInterval = configuration.get('focus.experimental.indicators.refreshRate') * 1000 * 60;
		let refreshNow = true;
		if (this._refreshTimer != null) {
			clearInterval(this._refreshTimer);
			refreshNow = false;
		}

		if (refreshInterval <= 0) return;

		if (refreshNow) {
			void this.focus.getCategorizedItems({ force: true });
		}

		this._refreshTimer = setInterval(() => {
			void this.focus.getCategorizedItems({ force: true });
		}, refreshInterval);
	}

	private clearRefreshTimer() {
		if (this._refreshTimer != null) {
			clearInterval(this._refreshTimer);
			this._refreshTimer = undefined;
		}
	}

	private updateStatusBar(statusBarFocus: StatusBarItem, categorizedItems: FocusItem[]) {
		let color: string | ThemeColor | undefined = undefined;
		let topItem: { item: FocusItem; groupLabel: string } | undefined;
		const groupedItems = groupAndSortFocusItems(categorizedItems);
		if (!groupedItems?.size) {
			statusBarFocus.tooltip = 'You are all caught up!';
		} else {
			statusBarFocus.tooltip = new MarkdownString('', true);
			statusBarFocus.tooltip.supportHtml = true;
			statusBarFocus.tooltip.isTrusted = true;

			for (const group of focusGroups) {
				const items = groupedItems.get(group);
				if (items?.length) {
					if (statusBarFocus.tooltip.value.length > 0) {
						statusBarFocus.tooltip.appendMarkdown(`\n\n---\n\n`);
					}
					switch (group) {
						case 'mergeable':
							statusBarFocus.tooltip.appendMarkdown(
								`<span style="color:#00FF00;">$(circle-filled)</span> You have ${pluralize(
									'pull request',
									items.length,
								)} that can be merged.`,
							);
							statusBarFocus.tooltip.appendMarkdown('\n');
							statusBarFocus.tooltip.appendMarkdown(
								`<span>[Show all mergeable](command:gitlens.quickFocus?${encodeURIComponent(
									JSON.stringify({ state: { initialGroup: 'mergeable' } }),
								)})</span>`,
							);
							color = '#00FF00';
							topItem ??= { item: items[0], groupLabel: 'can be merged' };
							break;
						case 'blocked': {
							const action = groupByMap(items, i =>
								i.actionableCategory === 'failed-checks' ||
								i.actionableCategory === 'mergeable-conflicts' ||
								i.actionableCategory === 'conflicts'
									? i.actionableCategory
									: 'blocked',
							);
							let item: FocusItem | undefined;

							let actionGroupItems = action.get('failed-checks');
							if (actionGroupItems?.length) {
								const message = `You have ${pluralize('pull request', actionGroupItems.length)} that ${
									actionGroupItems.length > 1 ? 'have' : 'has'
								} failed CI checks.`;
								statusBarFocus.tooltip.appendMarkdown(
									`<span style="color:#FF0000;">$(circle-filled)</span> ${message}`,
								);
								item ??= actionGroupItems[0];
							}

							actionGroupItems = action.get('mergeable-conflicts');
							if (actionGroupItems?.length) {
								const message = `You have ${pluralize(
									'pull request',
									actionGroupItems.length,
								)} that can be merged once conflicts are resolved.`;
								statusBarFocus.tooltip.appendMarkdown(
									`<span style="color:#FF0000;">$(circle-filled)</span> ${message}`,
								);
								item ??= actionGroupItems[0];
							}

							actionGroupItems = action.get('conflicts');
							if (actionGroupItems?.length) {
								const message = `You have ${pluralize('pull request', actionGroupItems.length)} that ${
									actionGroupItems.length > 1 ? 'have' : 'has'
								} conflicts.`;
								statusBarFocus.tooltip.appendMarkdown(
									`<span style="color:#FF0000;">$(circle-filled)</span> ${message}`,
								);
								item ??= actionGroupItems[0];
							}

							actionGroupItems = action.get('blocked');
							if (actionGroupItems?.length) {
								const message = `You have ${pluralize('pull request', actionGroupItems.length)} that ${
									actionGroupItems.length > 1 ? 'need' : 'needs'
								} attention.`;
								statusBarFocus.tooltip.appendMarkdown(
									`<span style="color:#FF0000;">$(circle-filled)</span> ${message}`,
								);
								item ??= actionGroupItems[0];
							}

							color ??= '#FF0000';
							if (item != null) {
								statusBarFocus.tooltip.appendMarkdown('\n');
								statusBarFocus.tooltip.appendMarkdown(
									`<span>[Show all blocked](command:gitlens.quickFocus?${encodeURIComponent(
										JSON.stringify({ state: { initialGroup: 'blocked' } }),
									)})</span>`,
								);
								let label = 'is blocked';
								if (item.actionableCategory === 'failed-checks') {
									label = 'failed CI checks';
								} else if (
									item.actionableCategory === 'mergeable-conflicts' ||
									item.actionableCategory === 'conflicts'
								) {
									label = 'has conflicts';
								}
								topItem ??= { item: item, groupLabel: label };
							}
							break;
						}
						case 'needs-review':
							statusBarFocus.tooltip.appendMarkdown(
								`<span style="color:#FFFF00;">$(circle-filled)</span> You have ${pluralize(
									'pull request',
									items.length,
								)} that ${items.length > 1 ? 'are' : 'is'} waiting for your review.`,
							);
							statusBarFocus.tooltip.appendMarkdown('\n');
							statusBarFocus.tooltip.appendMarkdown(
								`<span>[Show all waiting for review](command:gitlens.quickFocus?${encodeURIComponent(
									JSON.stringify({ state: { initialGroup: 'needs-review' } }),
								)})</span>`,
							);
							color ??= '#FFFF00';
							topItem ??= { item: items[0], groupLabel: 'needs your review' };
							break;
						case 'follow-up':
							statusBarFocus.tooltip.appendMarkdown(
								`<span style="color:#FFA500;">$(circle-filled)</span> You have ${pluralize(
									'pull request',
									items.length,
								)} that ${items.length > 1 ? 'have' : 'has'} been reviewed and ${
									items.length > 1 ? 'require' : 'requires'
								} follow-up.`,
							);
							statusBarFocus.tooltip.appendMarkdown('\n');
							statusBarFocus.tooltip.appendMarkdown(
								`<span>[Show all requiring follow-up](command:gitlens.quickFocus?${encodeURIComponent(
									JSON.stringify({ state: { initialGroup: 'follow-up' } }),
								)})</span>`,
							);
							color ??= '#FFA500';
							topItem ??= { item: items[0], groupLabel: 'requires follow-up' };
							break;
					}
				}
			}
		}

		statusBarFocus.text = topItem ? `$(target) #${topItem.item.id} ${topItem.groupLabel}` : '$(target)';
		statusBarFocus.color = color;
	}
}
