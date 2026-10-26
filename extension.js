import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {ShortcutProvider, formatAccelerator} from './lib/keybindings.js';

const PANEL_PADDING_X = 30;
const SECTION_GAP = 30;
const COLUMN_GAP = 24;
const ROW_HEIGHT = 22;
const GROUP_HEADER_HEIGHT = 26;

export default class HotkeyOverlayExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._provider = new ShortcutProvider(this);
        this._overlay = new ShortcutOverlay(this._provider);

        this._provider.connectChanged(() => this._overlay.refresh());

        Main.wm.addKeybinding(
            'toggle-overlay',
            this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._overlay.toggle()
        );
    }

    disable() {
        Main.wm.removeKeybinding('toggle-overlay');

        this._overlay?.destroy();
        this._overlay = null;

        this._provider?.destroy();
        this._provider = null;

        this._settings = null;
    }
}

class ShortcutOverlay {
    constructor(provider) {
        this._provider = provider;
        this._visible = false;
        this._backdrop = null;
        this._panel = null;
        this._stageKeyId = 0;
        this._refreshId = 0;
        this._fitId = 0;
        this._content = null;
        this._scrollView = null;
        this._contentWidth = 0;
        this._maxScrollHeight = 0;

        this._monitorsChangedId = Main.layoutManager.connect(
            'monitors-changed',
            () => {
                if (!this._visible)
                    return;

                this._destroyUI();
                this.show();
            }
        );
    }

    toggle() {
        if (this._visible)
            this.hide();
        else
            this.show();
    }

    show() {
        if (this._visible)
            return;

        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor)
            return;

        const data = this._provider.collect(Main.layoutManager.monitors.length);
        const panelWidth = Math.min(
            Math.max(monitor.width - 80, 640),
            1760,
            monitor.width - 24
        );

        this._panel = this._buildPanel(data, monitor, panelWidth);
        this._backdrop = new St.Bin({
            style_class: 'hotkey-overlay-backdrop',
            reactive: true,
            x: monitor.x,
            y: monitor.y,
            width: monitor.width,
            height: monitor.height,
        });

        this._panel.x_align = Clutter.ActorAlign.CENTER;
        this._panel.y_align = Clutter.ActorAlign.CENTER;
        this._backdrop.set_child(this._panel);
        this._backdrop.connect('button-press-event', () => {
            this.hide();
            return Clutter.EVENT_STOP;
        });
        this._panel.connect('button-press-event', () => Clutter.EVENT_STOP);

        const overlayGroup = Main.layoutManager.modalDialogGroup ?? Main.layoutManager.uiGroup;
        overlayGroup.add_child(this._backdrop);
        this._backdrop.opacity = 0;
        this._backdrop.ease({
            opacity: 255,
            duration: 140,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });

        this._stageKeyId = global.stage.connect(
            'captured-event',
            (_actor, event) => this._onKeyPress(event)
        );
        this._visible = true;

        this._fitId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._fitId = 0;
            this._fitContent();
            return GLib.SOURCE_REMOVE;
        });
    }

    _fitContent() {
        if (!this._visible || !this._content || !this._scrollView)
            return;

        const [, naturalHeight] = this._content.get_preferred_height(this._contentWidth);
        if (!naturalHeight || naturalHeight < 80)
            return;

        this._scrollView.set_height(
            Math.min(Math.max(naturalHeight, 120), this._maxScrollHeight)
        );
    }

    hide() {
        if (!this._visible)
            return;

        this._visible = false;
        this._disconnectStage();

        if (this._fitId) {
            GLib.source_remove(this._fitId);
            this._fitId = 0;
        }

        const backdrop = this._backdrop;
        this._backdrop = null;
        this._panel = null;
        this._content = null;
        this._scrollView = null;

        if (!backdrop)
            return;

        backdrop.ease({
            opacity: 0,
            duration: 100,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => backdrop.destroy(),
        });
    }

    refresh() {
        if (!this._visible)
            return;

        if (this._refreshId)
            return;

        this._refreshId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 120, () => {
            this._refreshId = 0;
            if (this._visible) {
                this._destroyUI();
                this.show();
            }
            return GLib.SOURCE_REMOVE;
        });
    }

    destroy() {
        if (this._refreshId) {
            GLib.source_remove(this._refreshId);
            this._refreshId = 0;
        }

        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = 0;
        }

        this._destroyUI();
        this._visible = false;
        this._provider = null;
    }

    _destroyUI() {
        this._visible = false;
        this._disconnectStage();

        if (this._fitId) {
            GLib.source_remove(this._fitId);
            this._fitId = 0;
        }

        this._content = null;
        this._scrollView = null;

        if (this._backdrop) {
            this._backdrop.destroy();
            this._backdrop = null;
            this._panel = null;
        }
    }

    _disconnectStage() {
        if (this._stageKeyId) {
            global.stage.disconnect(this._stageKeyId);
            this._stageKeyId = 0;
        }
    }

    _onKeyPress(event) {
        if (!this._visible || event.type() !== Clutter.EventType.KEY_PRESS)
            return Clutter.EVENT_PROPAGATE;

        if (event.get_key_symbol() === Clutter.KEY_Escape) {
            this.hide();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _buildPanel(data, monitor, panelWidth) {
        const panel = new St.BoxLayout({
            style_class: 'hotkey-overlay-panel',
            orientation: Clutter.Orientation.VERTICAL,
            reactive: true,
        });
        panel.set_width(panelWidth);

        const contentWidth = panelWidth - PANEL_PADDING_X * 2;
        const sources = data.sources;
        const sideBySide = sources.length > 1 && contentWidth >= 1500;

        const header = this._buildHeader(sources);
        const content = this._buildContent(sources, contentWidth, sideBySide);
        const scroll = new St.ScrollView({
            style_class: 'hotkey-overlay-scroll',
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            x_expand: true,
        });
        scroll.add_child(content);

        const maxScrollHeight = Math.max(240, Math.round(monitor.height * 0.88) - 132);
        const contentHeight = Math.max(
            this._estimateContentHeight(sources, contentWidth, sideBySide),
            120
        );

        scroll.set_height(Math.min(contentHeight, maxScrollHeight));

        this._content = content;
        this._scrollView = scroll;
        this._contentWidth = contentWidth;
        this._maxScrollHeight = maxScrollHeight;

        const footer = this._buildFooter(data);

        panel.add_child(header);
        panel.add_child(scroll);
        panel.add_child(footer);

        return panel;
    }

    _buildHeader(sources) {
        const header = new St.BoxLayout({
            style_class: 'hotkey-overlay-header',
            orientation: Clutter.Orientation.VERTICAL,
        });

        const title = new St.Label({
            text: 'Keyboard Shortcuts',
            style_class: 'hotkey-overlay-title',
        });

        const sourceNames = sources.map(source => source.title);
        let sourceText = sourceNames[0] ?? 'GNOME';
        if (sourceNames.length === 2)
            sourceText = `${sourceNames[0]} and ${sourceNames[1]}`;
        else if (sourceNames.length > 2)
            sourceText = `${sourceNames.slice(0, -1).join(', ')} and ${sourceNames.at(-1)}`;

        const subtitle = new St.Label({
            text: `Live shortcuts from ${sourceText}`,
            style_class: 'hotkey-overlay-subtitle',
        });

        header.add_child(title);
        header.add_child(subtitle);

        return header;
    }

    _buildContent(sources, contentWidth, sideBySide) {
        const content = new St.BoxLayout({
            style_class: sideBySide
                ? 'hotkey-overlay-content hotkey-overlay-content-horizontal'
                : 'hotkey-overlay-content',
            orientation: sideBySide
                ? Clutter.Orientation.HORIZONTAL
                : Clutter.Orientation.VERTICAL,
            x_expand: true,
        });

        if (sources.length === 0) {
            content.add_child(new St.Label({
                text: 'No shortcuts found.',
                style_class: 'hotkey-overlay-empty',
                x_expand: true,
                x_align: Clutter.ActorAlign.CENTER,
            }));
            return content;
        }

        if (sideBySide) {
            const sectionWidth = (contentWidth - SECTION_GAP) / 2;
            for (const source of sources) {
                content.add_child(this._buildSection(source, sectionWidth, 2));
            }
            return content;
        }

        const columns = contentWidth >= 1100 ? 3 : contentWidth >= 760 ? 2 : 1;
        for (const source of sources) {
            content.add_child(this._buildSection(source, contentWidth, columns));
        }

        return content;
    }

    _buildSection(source, sectionWidth, maxColumns) {
        const section = new St.BoxLayout({
            style_class: 'hotkey-overlay-section',
            orientation: Clutter.Orientation.VERTICAL,
            width: sectionWidth,
        });

        const titleRow = new St.BoxLayout({
            style_class: 'hotkey-overlay-section-header',
        });

        const title = new St.Label({
            text: source.title,
            style_class: 'hotkey-overlay-section-title',
        });
        const subtitle = new St.Label({
            text: source.subtitle,
            style_class: 'hotkey-overlay-section-subtitle',
            y_align: Clutter.ActorAlign.END,
        });

        titleRow.add_child(title);
        titleRow.add_child(subtitle);

        const rule = new St.Widget({
            style_class: 'hotkey-overlay-section-rule',
            x_expand: true,
        });

        const groupColumns = this._splitGroups(source.groups, maxColumns);
        const columnCount = groupColumns.length;
        const columnWidth = (sectionWidth - COLUMN_GAP * (columnCount - 1)) / columnCount;
        const keyWidth = Math.min(225, Math.max(150, Math.round(columnWidth * 0.48)));

        const columns = new St.BoxLayout({
            style_class: 'hotkey-overlay-columns',
            x_expand: true,
        });

        for (const groups of groupColumns) {
            const column = new St.BoxLayout({
                style_class: 'hotkey-overlay-column',
                orientation: Clutter.Orientation.VERTICAL,
                width: columnWidth,
            });

            for (const group of groups) {
                const groupBox = new St.BoxLayout({
                    style_class: 'hotkey-overlay-group',
                    orientation: Clutter.Orientation.VERTICAL,
                });

                const groupHeader = new St.BoxLayout({
                    style_class: 'hotkey-overlay-group-header',
                });
                const dot = new St.Widget({
                    style_class: 'hotkey-overlay-group-dot',
                    y_align: Clutter.ActorAlign.CENTER,
                });
                const groupTitle = new St.Label({
                    text: group.title,
                    style_class: 'hotkey-overlay-group-title',
                });

                groupHeader.add_child(dot);
                groupHeader.add_child(groupTitle);
                groupBox.add_child(groupHeader);

                for (const entry of group.entries) {
                    groupBox.add_child(
                        this._buildRow(entry, keyWidth)
                    );
                }

                column.add_child(groupBox);
            }

            columns.add_child(column);
        }

        section.add_child(titleRow);
        section.add_child(rule);
        section.add_child(columns);

        return section;
    }

    _buildRow(entry, keyWidth) {
        const row = new St.BoxLayout({
            style_class: 'hotkey-overlay-row',
            x_expand: true,
        });

        const keyBox = new St.BoxLayout({
            style_class: 'hotkey-overlay-keybox',
            width: keyWidth,
            x_expand: false,
            y_align: Clutter.ActorAlign.START,
        });

        const keyText = formatAccelerator(entry.accelerators[0]);
        const key = new St.Label({
            text: keyText,
            style_class: keyText.length > 27
                ? 'hotkey-overlay-key hotkey-overlay-key-long'
                : 'hotkey-overlay-key',
            y_align: Clutter.ActorAlign.START,
        });
        key.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        const keySpacer = new St.Widget({ x_expand: true });

        const action = new St.Label({
            text: entry.label,
            style_class: 'hotkey-overlay-action',
            x_expand: true,
        });
        action.clutter_text.set_line_wrap(true);
        action.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        action.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);

        keyBox.add_child(key);
        keyBox.add_child(keySpacer);
        row.add_child(keyBox);
        row.add_child(action);

        return row;
    }

    _buildFooter(data) {
        const footer = new St.BoxLayout({
            style_class: 'hotkey-overlay-footer',
            x_expand: true,
        });

        const hints = new St.BoxLayout({
            style_class: 'hotkey-overlay-hints',
        });
        hints.add_child(this._buildHint('Esc', 'Close'));

        if (data.toggleAccelerator)
            hints.add_child(this._buildHint(data.toggleAccelerator, 'Toggle'));

        const count = new St.Label({
            text: `${data.total} shortcuts`,
            style_class: 'hotkey-overlay-footer-label',
            x_expand: true,
            x_align: Clutter.ActorAlign.END,
            y_align: Clutter.ActorAlign.CENTER,
        });

        footer.add_child(hints);
        footer.add_child(count);

        return footer;
    }

    _buildHint(keyText, labelText) {
        const hint = new St.BoxLayout({
            style_class: 'hotkey-overlay-hint',
        });

        hint.add_child(new St.Label({
            text: keyText,
            style_class: 'hotkey-overlay-hint-key',
            y_align: Clutter.ActorAlign.CENTER,
        }));
        hint.add_child(new St.Label({
            text: labelText,
            style_class: 'hotkey-overlay-hint-label',
            y_align: Clutter.ActorAlign.CENTER,
        }));

        return hint;
    }

    _splitGroups(groups, maxColumns) {
        const count = Math.min(maxColumns, groups.length);
        if (count <= 1)
            return [groups];

        const heights = groups.map(group =>
            GROUP_HEADER_HEIGHT + group.entries.length * ROW_HEIGHT + 14
        );

        const prefix = [0];
        for (const height of heights)
            prefix.push(prefix.at(-1) + height);

        const best = Array.from(
            { length: count + 1 },
            () => Array(groups.length + 1).fill(Infinity)
        );
        const cuts = Array.from(
            { length: count + 1 },
            () => Array(groups.length + 1).fill(0)
        );
        best[0][0] = 0;

        for (let columns = 1; columns <= count; columns++) {
            for (let end = 1; end <= groups.length; end++) {
                for (let start = 0; start < end; start++) {
                    if (!Number.isFinite(best[columns - 1][start]))
                        continue;

                    const height = prefix[end] - prefix[start];
                    const cost = Math.max(best[columns - 1][start], height);
                    if (cost < best[columns][end]) {
                        best[columns][end] = cost;
                        cuts[columns][end] = start;
                    }
                }
            }
        }

        let finalColumns = count;
        while (finalColumns > 1 && !Number.isFinite(best[finalColumns][groups.length]))
            finalColumns--;

        if (finalColumns === 1)
            return [groups];

        const split = [];
        let end = groups.length;
        for (let columns = finalColumns; columns >= 1; columns--) {
            const start = cuts[columns][end];
            split.unshift(groups.slice(start, end));
            end = start;
        }

        return split.filter(groupsInColumn => groupsInColumn.length > 0);
    }

    _estimateContentHeight(sources, contentWidth, sideBySide) {
        if (sideBySide) {
            const sectionWidth = (contentWidth - SECTION_GAP) / 2;
            return Math.max(
                ...sources.map(source =>
                    this._estimateSectionHeight(source, sectionWidth, 2)
                )
            );
        }

        const columns = contentWidth >= 1100 ? 3 : contentWidth >= 760 ? 2 : 1;
        return sources.reduce(
            (height, source) =>
                height + this._estimateSectionHeight(source, contentWidth, columns),
            0
        ) + (sources.length - 1) * 28;
    }

    _estimateSectionHeight(source, sectionWidth, maxColumns) {
        const columns = this._splitGroups(source.groups, maxColumns);
        const groupHeight = group =>
            GROUP_HEADER_HEIGHT + group.entries.length * ROW_HEIGHT + 14;

        return 54 + Math.max(
            ...columns.map(groups =>
                groups.reduce((height, group) => height + groupHeight(group), 0)
            )
        );
    }
}
