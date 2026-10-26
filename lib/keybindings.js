import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const PAPERWM_UUID = 'paperwm@paperwm.github.com';
const PAPERWM_SCHEMA = 'org.gnome.shell.extensions.paperwm.keybindings';

const AS_TYPE = new GLib.VariantType('as');

const CORE_SCHEMAS = {
    wm: 'org.gnome.desktop.wm.keybindings',
    shell: 'org.gnome.shell.keybindings',
    mutter: 'org.gnome.mutter.keybindings',
    media: 'org.gnome.settings-daemon.plugins.media-keys',
};

const WM_SKIP = new Set([
    'activate-window-menu',
    'begin-move',
    'begin-resize',
    'cycle-group',
    'cycle-group-backward',
    'cycle-panels',
    'cycle-panels-backward',
]);

const GNOME_GROUP_ORDER = ['Windows', 'Workspaces', 'System', 'Screenshots', 'Media'];
const PAPERWM_GROUP_ORDER = [
    'Windows',
    'Focus',
    'Move',
    'Workspaces',
    'Layout',
    'Window switcher',
    'Scratch',
    'Monitors',
];

const PAPERWM_LABELS = {
    'new-window': 'New window',
    'close-window': 'Close window',
    'paper-toggle-fullscreen': 'Toggle fullscreen',
    'toggle-maximize-width': 'Maximize width',
    'switch-open-window-position': 'Switch window position',
    'switch-left': 'Focus left',
    'switch-right': 'Focus right',
    'switch-up': 'Focus up',
    'switch-down': 'Focus down',
    'switch-first': 'Focus first window',
    'switch-last': 'Focus last window',
    'switch-next': 'Focus next window',
    'switch-previous': 'Focus previous window',
    'move-left': 'Move window left',
    'move-right': 'Move window right',
    'move-up': 'Move window up',
    'move-down': 'Move window down',
    'take-window': 'Take window',
    'cycle-width': 'Cycle width',
    'cycle-width-backwards': 'Cycle width backward',
    'cycle-height': 'Cycle height',
    'cycle-height-backwards': 'Cycle height backward',
    'resize-w-inc': 'Wider',
    'resize-w-dec': 'Narrower',
    'resize-h-inc': 'Taller',
    'resize-h-dec': 'Shorter',
    'center-horizontally': 'Center horizontally',
    'center-vertically': 'Center vertically',
    'slurp-in': 'Consume window',
    'barf-out': 'Expel window',
    'barf-out-active': 'Expel active window',
    'drift-left': 'Drift view left',
    'drift-right': 'Drift view right',
    'switch-focus-mode': 'Cycle focus mode',
    'toggle-top-and-position-bar': 'Toggle top and position bar',
    'previous-workspace': 'Former workspace',
    'switch-up-workspace': 'Workspace above',
    'switch-down-workspace': 'Workspace below',
    'move-up-workspace': 'Move window to workspace above',
    'move-down-workspace': 'Move window to workspace below',
    'live-alt-tab': 'Switch windows',
    'live-alt-tab-backward': 'Switch windows backward',
    'toggle-scratch': 'Toggle scratch',
    'toggle-scratch-window': 'Toggle scratch window',
    'toggle-scratch-layer': 'Toggle scratch layer',
    'live-alt-tab-scratch': 'Switch scratch windows',
    'live-alt-tab-scratch-backward': 'Switch scratch windows backward',
    'move-monitor-left': 'Move window to left monitor',
    'move-monitor-right': 'Move window to right monitor',
    'move-monitor-above': 'Move window to monitor above',
    'move-monitor-below': 'Move window to monitor below',
    'move-space-monitor-left': 'Move workspace to left monitor',
    'move-space-monitor-right': 'Move workspace to right monitor',
    'move-space-monitor-above': 'Move workspace to monitor above',
    'move-space-monitor-below': 'Move workspace to monitor below',
    'swap-monitor-left': 'Swap workspace left',
    'swap-monitor-right': 'Swap workspace right',
    'swap-monitor-above': 'Swap workspace above',
    'swap-monitor-below': 'Swap workspace below',
    'switch-monitor-left': 'Focus left monitor',
    'switch-monitor-right': 'Focus right monitor',
    'switch-monitor-above': 'Focus monitor above',
    'switch-monitor-below': 'Focus monitor below',
};

const GNOME_LABELS = {
    'close': 'Close window',
    'minimize': 'Minimize window',
    'toggle-maximized': 'Toggle maximize',
    'show-desktop': 'Show desktop',
    'cycle-windows': 'Cycle windows',
    'cycle-windows-backward': 'Cycle windows backward',
    'panel-run-dialog': 'Run command',
    'switch-input-source': 'Next input source',
    'switch-input-source-backward': 'Previous input source',
    'switch-to-workspace-last': 'Last workspace',
    'move-to-workspace-last': 'Move window to last workspace',
    'toggle-overview': 'Overview',
    'toggle-application-view': 'Applications',
    'toggle-quick-settings': 'Quick settings',
    'show-screenshot-ui': 'Screenshot',
    'screenshot-window': 'Screenshot window',
    'show-screen-recording-ui': 'Screen recording',
    'switch-monitor': 'Switch monitor',
    'terminal': 'Terminal',
    'screensaver': 'Lock screen',
    'logout': 'Log out',
    'volume-up': 'Volume up',
    'volume-down': 'Volume down',
    'volume-mute': 'Mute',
    'mic-mute': 'Mute microphone',
    'toggle-overlay': 'Show shortcuts',
};

const MODIFIER_NAMES = {
    'Super': 'Super',
    'Mod4': 'Super',
    'Meta': 'Super',
    'Ctrl': 'Ctrl',
    'Control': 'Ctrl',
    'Primary': 'Ctrl',
    'Alt': 'Alt',
    'Mod1': 'Alt',
    'Shift': 'Shift',
    'Mod5': 'AltGr',
    'ISO_Level3_Shift': 'AltGr',
};

const MODIFIER_ORDER = ['Super', 'Ctrl', 'Shift', 'Alt', 'AltGr'];

const KEY_NAMES = {
    'Return': 'Enter',
    'space': 'Space',
    'Page_Up': 'Page Up',
    'Page_Down': 'Page Down',
    'Above_Tab': 'Above Tab',
    'grave': '`',
    'bracketleft': '[',
    'bracketright': ']',
    'plus': '+',
    'minus': '-',
    'equal': '=',
    'comma': ',',
    'period': '.',
    'slash': '/',
    'backslash': '\\',
    'apostrophe': "'",
    'semicolon': ';',
    'colon': ':',
    'exclam': '!',
    'question': '?',
    'at': '@',
    'numbersign': '#',
    'dollar': '$',
    'percent': '%',
    'asciicircum': '^',
    'ampersand': '&',
    'asterisk': '*',
    'parenleft': '(',
    'parenright': ')',
    'underscore': '_',
    'Escape': 'Esc',
    'BackSpace': 'Backspace',
    'Print': 'Print',
    'Delete': 'Delete',
    'Insert': 'Insert',
    'Home': 'Home',
    'End': 'End',
    'Tab': 'Tab',
    'Left': 'Left',
    'Right': 'Right',
    'Up': 'Up',
    'Down': 'Down',
    'XF86AudioRaiseVolume': 'Volume Up',
    'XF86AudioLowerVolume': 'Volume Down',
    'XF86AudioMute': 'Mute',
    'XF86AudioMicMute': 'Mic Mute',
    'XF86MonBrightnessUp': 'Brightness Up',
    'XF86MonBrightnessDown': 'Brightness Down',
    'XF86KbdBrightnessUp': 'Keyboard Brightness Up',
    'XF86KbdBrightnessDown': 'Keyboard Brightness Down',
    'XF86KbdLightOnOff': 'Keyboard Brightness Cycle',
    'XF86AudioPlay': 'Play',
    'XF86AudioPause': 'Pause',
    'XF86AudioStop': 'Stop',
    'XF86AudioNext': 'Next Track',
    'XF86AudioPrev': 'Previous Track',
};

const KEY_ORDER = {
    'Left': 10,
    'Right': 11,
    'Up': 12,
    'Down': 13,
    'Page_Up': 20,
    'Page_Down': 21,
    'Home': 30,
    'End': 31,
    'Tab': 40,
    'Above_Tab': 41,
    'Return': 50,
    'Escape': 51,
    'BackSpace': 52,
    'Delete': 53,
};

export function parseAccelerator(accelerator) {
    if (typeof accelerator !== 'string' || accelerator.length === 0)
        return null;

    const match = accelerator.match(/^((?:<[^>]+>)+)?(.+)$/);
    if (!match)
        return null;

    const modifiers = [];
    if (match[1]) {
        for (const token of match[1].matchAll(/<([^>]+)>/g)) {
            const name = MODIFIER_NAMES[token[1]];
            if (name && !modifiers.includes(name))
                modifiers.push(name);
        }
    }

    return { modifiers, key: match[2] };
}

export function formatAccelerator(accelerator) {
    const parsed = parseAccelerator(accelerator);
    if (!parsed)
        return accelerator;

    const key = formatKey(parsed.key);
    const modifiers = [...parsed.modifiers].sort(
        (a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b)
    );

    return [...modifiers, key].join(' + ');
}

function formatKey(key) {
    if (KEY_NAMES[key])
        return KEY_NAMES[key];

    if (/^XF86/.test(key))
        return key.replace(/^XF86/, '').replace(/([a-z])([A-Z])/g, '$1 $2');

    if (key.length === 1 && /[a-z]/.test(key))
        return key.toUpperCase();

    return key;
}

function isUsableAccelerator(accelerator) {
    if (typeof accelerator !== 'string' || accelerator.length === 0)
        return false;

    if (accelerator === 'disabled')
        return false;

    const parsed = parseAccelerator(accelerator);
    if (!parsed)
        return false;

    return !/^XF86/.test(parsed.key);
}

function schemaAccelerators(settings, key) {
    if (!settings)
        return [];

    return settings.get_strv(key).filter(isUsableAccelerator);
}

function schemaBindings(settings) {
    if (!settings)
        return [];

    const bindings = [];
    const schema = settings.settings_schema;

    for (const key of schema.list_keys()) {
        const schemaKey = schema.get_key(key);
        if (!schemaKey.get_value_type().equal(AS_TYPE))
            continue;

        if (key.endsWith('-static'))
            continue;

        const accelerators = schemaAccelerators(settings, key);
        if (accelerators.length === 0)
            continue;

        bindings.push({ key, accelerators });
    }

    return bindings;
}

function addEntry(groups, group, entry) {
    if (!groups.has(group))
        groups.set(group, []);

    groups.get(group).push(entry);
}

function groupRank(groups, order) {
    return [...groups.entries()]
        .filter(([, entries]) => entries.length > 0)
        .sort((a, b) => {
            const rankA = order.indexOf(a[0]);
            const rankB = order.indexOf(b[0]);
            return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
        })
        .map(([title, entries]) => ({
            title,
            entries: entries.sort((a, b) => compareEntries(a, b, title)),
        }));
}

const ALPHABETICAL_GROUPS = new Set([
    'Windows',
    'Layout',
    'System',
    'Screenshots',
    'Scratch',
    'Window switcher',
    'Monitors',
]);

const SCREENSHOT_ORDER = new Map([
    ['Screenshot', 0],
    ['Screenshot window', 1],
    ['Screen recording', 2],
]);

function compareEntries(a, b, group) {
    if (group === 'Workspaces') {
        const rankA = workspaceRank(a.label);
        const rankB = workspaceRank(b.label);
        if (rankA !== rankB)
            return rankA - rankB;
    }

    if (group === 'Screenshots') {
        return (SCREENSHOT_ORDER.get(a.label) ?? 9) -
            (SCREENSHOT_ORDER.get(b.label) ?? 9);
    }

    if (ALPHABETICAL_GROUPS.has(group))
        return a.label.localeCompare(b.label);

    const rankA = acceleratorRank(a.accelerators[0]);
    const rankB = acceleratorRank(b.accelerators[0]);
    if (rankA !== rankB)
        return rankA - rankB;

    return a.label.localeCompare(b.label);
}

function workspaceRank(label) {
    if (label.startsWith('Move window')) {
        const number = label.match(/workspace (\d+)/);
        if (number)
            return 200 + Number(number[1]);

        if (label.includes('above'))
            return 190;
        if (label.includes('below'))
            return 191;
        if (label.includes('last'))
            return 299;

        return 250;
    }

    if (label === 'Workspace above')
        return 10;
    if (label === 'Workspace below')
        return 11;
    if (label === 'Former workspace')
        return 12;
    if (label === 'Last workspace')
        return 19;

    const number = label.match(/^Workspace (\d+)$/);
    if (number)
        return Number(number[1]);

    return 100;
}

function acceleratorRank(accelerator) {
    const parsed = parseAccelerator(accelerator);
    if (!parsed)
        return 9999;

    const modifierRank = parsed.modifiers.reduce((rank, modifier) => {
        const index = MODIFIER_ORDER.indexOf(modifier);
        return rank * 10 + (index === -1 ? 9 : index);
    }, 0);

    let keyRank = KEY_ORDER[parsed.key];
    if (keyRank === undefined) {
        if (/^\d$/.test(parsed.key))
            keyRank = 100 + Number(parsed.key);
        else if (parsed.key.length === 1)
            keyRank = 200 + parsed.key.toLowerCase().charCodeAt(0);
        else
            keyRank = 500;
    }

    return modifierRank * 10000 + keyRank;
}

function paperwmGroup(key) {
    if (key.includes('monitor'))
        return 'Monitors';

    if (key.includes('workspace'))
        return 'Workspaces';

    if (key.startsWith('live-alt-tab-scratch'))
        return 'Scratch';

    if (key.startsWith('live-alt-tab'))
        return 'Window switcher';

    if (key.includes('scratch'))
        return 'Scratch';

    if (key === 'take-window')
        return 'Move';

    if (key.startsWith('move-'))
        return 'Move';

    if ([
        'switch-left',
        'switch-right',
        'switch-up',
        'switch-down',
        'switch-first',
        'switch-last',
        'switch-next',
        'switch-previous',
    ].includes(key))
        return 'Focus';

    if ([
        'new-window',
        'close-window',
        'paper-toggle-fullscreen',
        'toggle-maximize-width',
        'switch-open-window-position',
    ].includes(key))
        return 'Windows';

    return 'Layout';
}

function paperwmLabel(key) {
    return PAPERWM_LABELS[key] ?? null;
}

function gnomeLabel(key) {
    if (GNOME_LABELS[key])
        return GNOME_LABELS[key];

    let match = key.match(/^switch-to-workspace-(\d+)$/);
    if (match)
        return `Workspace ${match[1]}`;

    match = key.match(/^move-to-workspace-(\d+)$/);
    if (match)
        return `Move window to workspace ${match[1]}`;

    match = key.match(/^switch-to-workspace-(left|right|up|down)$/);
    if (match)
        return `Workspace ${match[1]}`;

    match = key.match(/^move-to-workspace-(left|right|up|down)$/);
    if (match)
        return `Move window to workspace ${match[1]}`;

    match = key.match(/^switch-to-application-(\d+)$/);
    if (match)
        return `Application ${match[1]}`;

    match = key.match(/^open-new-window-application-(\d+)$/);
    if (match)
        return `New window of application ${match[1]}`;

    return key
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function isDirectionalWorkspaceKey(key) {
    return /^(?:switch|move)-to-workspace-(?:left|right|up|down)$/.test(key);
}

function loadExtensionSettings(uuid, schemaId) {
    const dataDirs = [GLib.get_user_data_dir(), ...GLib.get_system_data_dirs()];

    for (const dataDir of dataDirs) {
        const schemaDir = GLib.build_filenamev([
            dataDir,
            'gnome-shell',
            'extensions',
            uuid,
            'schemas',
        ]);

        const compiled = GLib.build_filenamev([schemaDir, 'gschemas.compiled']);
        if (!GLib.file_test(compiled, GLib.FileTest.EXISTS))
            continue;

        try {
            const source = Gio.SettingsSchemaSource.new_from_directory(
                schemaDir,
                Gio.SettingsSchemaSource.get_default(),
                false
            );

            const schema = source.lookup(schemaId, false);
            if (!schema)
                continue;

            return new Gio.Settings({ settings_schema: schema });
        } catch (error) {
            console.warn(`Hotkey Overlay: cannot load ${schemaId}: ${error.message}`);
        }
    }

    return null;
}

function isExtensionEnabled(uuid) {
    try {
        const shellSettings = new Gio.Settings({ schema_id: 'org.gnome.shell' });
        return shellSettings.get_strv('enabled-extensions').includes(uuid);
    } catch (error) {
        return true;
    }
}

export class ShortcutProvider {
    constructor(extension) {
        this._core = {};
        this._watched = [];
        this._connections = [];
        this._paperwm = null;
        this._paperwmLoaded = false;

        for (const [name, schemaId] of Object.entries(CORE_SCHEMAS)) {
            try {
                const settings = new Gio.Settings({ schema_id: schemaId });
                this._core[name] = settings;
                this._watched.push(settings);
            } catch (error) {
                console.warn(`Hotkey Overlay: cannot open ${schemaId}: ${error.message}`);
            }
        }

        this._ownSettings = extension.getSettings();
        this._watched.push(this._ownSettings);

        this._getPaperwmSettings();
    }

    connectChanged(callback) {
        for (const settings of this._watched) {
            const id = settings.connect('changed', callback);
            this._connections.push([settings, id]);
        }
    }

    destroy() {
        for (const [settings, id] of this._connections)
            settings.disconnect(id);

        this._connections = [];
        this._watched = [];
        this._core = {};
        this._ownSettings = null;
        this._paperwm = null;
    }

    collect(monitorCount = 1) {
        const sources = [];

        const paperwm = this._collectPaperwm(monitorCount);
        if (paperwm)
            sources.push(paperwm);

        const gnome = this._collectGnome(monitorCount);
        if (gnome)
            sources.push(gnome);

        const toggleAccelerators = this._ownSettings
            ? this._ownSettings.get_strv('toggle-overlay').filter(isUsableAccelerator)
            : [];

        return {
            sources,
            total: sources.reduce(
                (total, source) =>
                    total + source.groups.reduce((sum, group) => sum + group.entries.length, 0),
                0
            ),
            toggleAccelerator: toggleAccelerators.length > 0
                ? formatAccelerator(toggleAccelerators[0])
                : null,
        };
    }

    _getPaperwmSettings() {
        if (this._paperwmLoaded)
            return this._paperwm;

        this._paperwmLoaded = true;
        if (!isExtensionEnabled(PAPERWM_UUID))
            return null;

        this._paperwm = loadExtensionSettings(PAPERWM_UUID, PAPERWM_SCHEMA);
        if (this._paperwm)
            this._watched.push(this._paperwm);
        else
            console.warn('Hotkey Overlay: PaperWM keybindings are not available');

        return this._paperwm;
    }

    _collectPaperwm(monitorCount) {
        const settings = this._getPaperwmSettings();
        if (!settings)
            return null;

        const groups = new Map();
        const skipped = new Set([
            'previous-workspace-backward',
            'move-previous-workspace',
            'move-previous-workspace-backward',
        ]);

        for (const binding of schemaBindings(settings)) {
            if (skipped.has(binding.key))
                continue;

            if (monitorCount < 2 && binding.key.includes('monitor'))
                continue;

            const label = paperwmLabel(binding.key);
            if (!label)
                continue;

            addEntry(groups, paperwmGroup(binding.key), {
                label,
                accelerators: binding.accelerators,
            });
        }

        const orderedGroups = groupRank(groups, PAPERWM_GROUP_ORDER);
        if (orderedGroups.length === 0)
            return null;

        return {
            id: 'paperwm',
            title: 'PaperWM',
            subtitle: 'Tiling window manager',
            groups: orderedGroups,
        };
    }

    _collectGnome(monitorCount) {
        const groups = new Map();

        for (const binding of schemaBindings(this._core.wm)) {
            if (WM_SKIP.has(binding.key))
                continue;

            if (isDirectionalWorkspaceKey(binding.key))
                continue;

            let group = null;
            if (binding.key.includes('workspace'))
                group = 'Workspaces';
            else if (binding.key === 'switch-input-source' ||
                     binding.key === 'switch-input-source-backward' ||
                     binding.key === 'panel-run-dialog')
                group = 'System';
            else if (binding.key === 'close' ||
                     binding.key === 'minimize' ||
                     binding.key === 'toggle-maximized' ||
                     binding.key === 'show-desktop' ||
                     binding.key === 'cycle-windows' ||
                     binding.key === 'cycle-windows-backward')
                group = 'Windows';

            if (!group)
                continue;

            addEntry(groups, group, {
                label: gnomeLabel(binding.key),
                accelerators: binding.accelerators,
            });
        }

        const hasScreenshotUi = schemaAccelerators(this._core.shell, 'show-screenshot-ui').length > 0;
        for (const binding of schemaBindings(this._core.shell)) {
            if (/^(?:open-new-window-application-|switch-to-application-)/.test(binding.key))
                continue;

            if (binding.key === 'screenshot' && hasScreenshotUi)
                continue;

            let group = null;
            if (binding.key === 'toggle-overview' ||
                binding.key === 'toggle-application-view' ||
                binding.key === 'toggle-quick-settings')
                group = 'System';
            else if (binding.key === 'show-screenshot-ui' ||
                     binding.key === 'screenshot' ||
                     binding.key === 'screenshot-window' ||
                     binding.key === 'show-screen-recording-ui')
                group = 'Screenshots';

            if (!group)
                continue;

            addEntry(groups, group, {
                label: gnomeLabel(binding.key),
                accelerators: binding.accelerators,
            });
        }

        for (const binding of schemaBindings(this._core.media)) {
            if (!['terminal', 'screensaver', 'logout', 'volume-up', 'volume-down',
                'volume-mute', 'mic-mute'].includes(binding.key))
                continue;

            addEntry(groups, binding.key.startsWith('volume-') || binding.key === 'mic-mute'
                ? 'Media'
                : 'System', {
                label: gnomeLabel(binding.key),
                accelerators: binding.accelerators,
            });
        }

        if (monitorCount > 1) {
            for (const binding of schemaBindings(this._core.mutter)) {
                if (binding.key !== 'switch-monitor')
                    continue;

                addEntry(groups, 'System', {
                    label: gnomeLabel(binding.key),
                    accelerators: binding.accelerators,
                });
            }
        }

        if (this._ownSettings) {
            const accelerators = schemaAccelerators(this._ownSettings, 'toggle-overlay');
            if (accelerators.length > 0) {
                addEntry(groups, 'System', {
                    label: gnomeLabel('toggle-overlay'),
                    accelerators,
                });
            }
        }

        const orderedGroups = groupRank(groups, GNOME_GROUP_ORDER);
        if (orderedGroups.length === 0)
            return null;

        return {
            id: 'gnome',
            title: 'GNOME',
            subtitle: 'Shell, windows and system',
            groups: orderedGroups,
        };
    }
}
