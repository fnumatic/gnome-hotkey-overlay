# GNOME Hotkey Overlay

A small GNOME Shell extension that shows the important keyboard shortcuts of
the current session in a Niri-style overlay. Press `Super`+`K` to open it.

The overlay reads live values from GSettings, so it follows changes made in
GNOME Settings, `gsettings`, or PaperWM's preferences. There is no shortcut
list to maintain.

## Requirements

- GNOME Shell 51
- PaperWM (optional; its shortcuts are added when the extension is enabled)

## Features

- `Super`+`K` opens and closes the overlay; `Esc` or a click outside closes it.
- Shortcuts are grouped by application and purpose.
- GNOME and PaperWM actions use short English labels.
- Hardware media keys and per-application number shortcuts are left out to keep
  the overlay focused.
- Monitor shortcuts appear only when more than one monitor is connected.
- Binding changes are reflected while the overlay is open.

## Installation

```bash
make install
make enable
```

The extension is copied to
`~/.local/share/gnome-shell/extensions/hotkey-overlay@unf`.

On Wayland, GNOME Shell may not notice a newly installed extension until the
next login. If `make enable` reports that the extension does not exist, log out
and back in, then run `make enable` again.

For development, `make link` symlinks the working tree into the extension
directory instead of copying it.

## Usage

- `Super`+`K` toggles the overlay.
- `Esc` or a click on the dimmed background closes it.

To change the toggle shortcut:

```bash
gsettings set org.gnome.shell.extensions.hotkey-overlay toggle-overlay "['<Super>k']"
```

The value is a GVariant string array, so use the `"['...']"` form.

## Uninstall

```bash
make disable
make uninstall
```

## Development

```bash
glib-compile-schemas schemas
```

Reload GNOME Shell after changing extension code on Wayland by logging out and
back in. Watch the journal for errors:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## How shortcuts are selected

Core GNOME bindings come from these schemas:

- `org.gnome.desktop.wm.keybindings`
- `org.gnome.shell.keybindings`
- `org.gnome.mutter.keybindings`
- `org.gnome.settings-daemon.plugins.media-keys`

PaperWM bindings are read from
`org.gnome.shell.extensions.paperwm.keybindings` when PaperWM is enabled. The
schema is loaded from the extension's own `schemas` directory because it is not
installed system-wide.

The overlay intentionally shows the shortcuts that are useful on a desktop, not
every bound key. Numeric application shortcuts, keyboard-move/resize helpers,
and `XF86` media keys are filtered out. Everything shown still comes from the
live settings; only the labels and group names are defined by the extension.

## License

Not specified.
