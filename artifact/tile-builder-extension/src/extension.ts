import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import debounce from "lodash.debounce";
import * as vscode from "vscode";

const CONFIG_FILE = "tile-builder-config.json";
const TILE_EXT_TXT = ".tile.txt";
const TILE_EXT_YML = ".tile.yml";
const PREVIEW_FILENAME = "tile-preview.png";

function isTileFile(path: string): boolean {
  return path.endsWith(TILE_EXT_TXT) || path.endsWith(TILE_EXT_YML);
}
const DEBOUNCE_MS = 300;

function findNearestConfig(filePath: string): string | undefined {
  let dir = path.dirname(filePath);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
  if (!workspaceFolder) {
    return undefined;
  }
  const root = workspaceFolder.uri.fsPath;

  while (dir.length >= root.length && dir !== path.dirname(dir)) {
    const configPath = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    dir = path.dirname(dir);
  }
  return undefined;
}

function getPreviewOutputPath(): string {
  const previewDir = path.join(os.tmpdir(), "tile-builder");
  fs.mkdirSync(previewDir, { recursive: true });
  return path.join(previewDir, PREVIEW_FILENAME);
}

function runTileBuilder(
  context: vscode.ExtensionContext,
  configPath: string,
  inputPath: string,
  outputPath: string,
  cwd: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const binName = process.platform === "win32" ? "tile-builder.exe" : "tile-builder";
    const binPath = path.join(context.extensionPath, "bin", binName);

    const proc = spawn(binPath, ["--config", configPath, "--input", inputPath, "--output", outputPath], {
      cwd,
      stdio: "ignore",
    });
    proc.on("close", (code) => {
      resolve(code === 0);
    });

    proc.on("error", () => {
      resolve(false);
    });
  });
}

async function renderTileDocument(
  document: vscode.TextDocument,
  context: vscode.ExtensionContext,
  showPreview: boolean,
): Promise<boolean> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    return false;
  }

  const inputPath = document.uri.fsPath;
  const configPath = findNearestConfig(inputPath);
  if (!configPath) {
    vscode.window.showErrorMessage(`No ${CONFIG_FILE} found`);
    return false;
  }

  const outputPath = getPreviewOutputPath();

  const binName = process.platform === "win32" ? "tile-builder.exe" : "tile-builder";
  const binPath = path.join(context.extensionPath, "bin", binName);
  if (!fs.existsSync(binPath)) {
    vscode.window.showErrorMessage(`Tile-builder binary not found at ${binPath}`);
    return false;
  }

  const success = await runTileBuilder(context, configPath, inputPath, outputPath, workspaceFolder.uri.fsPath);

  if (success && showPreview) {
    const outputUri = vscode.Uri.file(outputPath);
    await vscode.commands.executeCommand("vscode.open", outputUri, {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true,
    });
  } else if (!success) {
    vscode.window.showErrorMessage("Tile render failed. See Tile Builder output for details.");
  }

  return success;
}

export function activate(context: vscode.ExtensionContext) {
  let lastRenderedTileUri: vscode.Uri | undefined;

  const doRender = async (document: vscode.TextDocument, showPreview: boolean) => {
    const ok = await renderTileDocument(document, context, showPreview);
    if (ok) {
      lastRenderedTileUri = document.uri;
    }
  };

  const debouncedTileRender = debounce((document: vscode.TextDocument) => {
    doRender(document, false);
  }, DEBOUNCE_MS);

  const debouncedConfigRender = debounce(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor && isTileFile(editor.document.uri.fsPath)) {
      doRender(editor.document, false);
    } else if (lastRenderedTileUri) {
      const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === lastRenderedTileUri?.toString());
      if (doc) {
        doRender(doc, false);
      }
    }
  }, DEBOUNCE_MS);

  const debouncedActiveEditorRender = debounce(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor && isTileFile(editor.document.uri.fsPath)) {
      doRender(editor.document, true);
    }
  }, DEBOUNCE_MS);

  // On switch to different .tile.txt tab: rerender for that file
  const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(debouncedActiveEditorRender);

  // On open of .tile.txt: render and show PNG beside
  const openDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    if (!isTileFile(document.uri.fsPath)) {
      return;
    }
    await doRender(document, true);
  });

  // On edit of .tile.txt: debounced rerender (PNG tab auto-refreshes if open)
  const changeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
    if (!isTileFile(e.document.uri.fsPath)) {
      return;
    }
    debouncedTileRender(e.document);
  });

  // On edit of tile-builder-config.json: debounced rerender
  const configChangeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
    if (!e.document.uri.fsPath.endsWith(CONFIG_FILE)) {
      return;
    }
    debouncedConfigRender();
  });

  // On save of .tile.txt: render and show PNG
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (!isTileFile(document.uri.fsPath)) {
      return;
    }
    await doRender(document, true);
  });

  context.subscriptions.push(
    activeEditorDisposable,
    openDisposable,
    changeDisposable,
    configChangeDisposable,
    saveDisposable,
  );
}

export function deactivate() {}
