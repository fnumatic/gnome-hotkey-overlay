UUID := hotkey-overlay@unf
EXTENSION_DIR := $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

.PHONY: all schemas install uninstall enable disable link clean

all: schemas

schemas:
	glib-compile-schemas schemas

install: schemas
	rm -rf "$(EXTENSION_DIR)"
	mkdir -p "$(EXTENSION_DIR)/lib" "$(EXTENSION_DIR)/schemas"
	cp -a extension.js metadata.json stylesheet.css "$(EXTENSION_DIR)/"
	cp -a lib/. "$(EXTENSION_DIR)/lib/"
	cp -a schemas/. "$(EXTENSION_DIR)/schemas/"
	glib-compile-schemas "$(EXTENSION_DIR)/schemas"
	@echo "Installed in $(EXTENSION_DIR)"

link: schemas
	rm -rf "$(EXTENSION_DIR)"
	mkdir -p "$(dir $(EXTENSION_DIR))"
	ln -s "$(CURDIR)" "$(EXTENSION_DIR)"
	@echo "Linked $(EXTENSION_DIR) -> $(CURDIR)"

uninstall:
	rm -rf "$(EXTENSION_DIR)"

enable:
	gnome-extensions enable "$(UUID)"

disable:
	gnome-extensions disable "$(UUID)"

clean:
	rm -f schemas/gschemas.compiled
