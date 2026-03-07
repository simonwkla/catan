# Tile Builder Extension

Live preview for `.tile.txt` files. When you save a tile config, the extension renders it and opens the image in a split view—like Markdown preview.

## How it works

1. Save a `.tile.txt` file
2. The extension finds the nearest `tile-builder-config.json` (walking up the file tree)
3. Renders the tile to a temp file and opens it in a split view to the right

