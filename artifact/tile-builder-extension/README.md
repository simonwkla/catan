# Tile Builder Extension

Live preview for `.tile.txt` files—like Jupyter or Quarto preview. Renders tiles in a webview you can toggle on/off.

## How it works

1. Open a `.tile.txt` file (preview opens automatically)
2. Or click **Open Preview** in the editor title bar when viewing a tile file
3. Or run **Tile Builder: Open Preview** from the command palette
4. The extension finds the nearest `tile-builder-config.json` (walking up the file tree)
5. Renders the tile and displays it in a webview panel beside the editor
6. Preview updates automatically when you edit the tile or the config

