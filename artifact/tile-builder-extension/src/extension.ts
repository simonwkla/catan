import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

const CONFIG_FILE = "tile-builder-config.json";
const TILE_EXT = ".tile.txt";
const PREVIEW_FILENAME = "tile-preview.png";

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
      stdio: ["ignore", "pipe", "pipe"],
    });

    const output = vscode.window.createOutputChannel("Tile Builder");
    output.show();
    proc.stdout?.on("data", (data) => output.append(data.toString()));
    proc.stderr?.on("data", (data) => output.append(data.toString()));

    proc.on("close", (code) => {
      resolve(code === 0);
    });

    proc.on("error", (err) => {
      output.appendLine(`Error: ${err.message}`);
      resolve(false);
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  // On save of .tile.txt: render and show in split view
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (!document.uri.fsPath.endsWith(TILE_EXT)) {
      return;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return;
    }

    const inputPath = document.uri.fsPath;
    const configPath = findNearestConfig(inputPath);
    if (!configPath) {
      vscode.window.showErrorMessage(`No ${CONFIG_FILE} found in the file tree above ${path.basename(inputPath)}.`);
      return;
    }

    const outputPath = getPreviewOutputPath();

    const binName = process.platform === "win32" ? "tile-builder.exe" : "tile-builder";
    const binPath = path.join(context.extensionPath, "bin", binName);
    if (!fs.existsSync(binPath)) {
      vscode.window.showErrorMessage(`Tile-builder binary not found at ${binPath}. Run 'just build-tb' to build it.`);
      return;
    }

    const success = await runTileBuilder(context, configPath, inputPath, outputPath, workspaceFolder.uri.fsPath);

    if (success) {
      const outputUri = vscode.Uri.file(outputPath);
      await vscode.commands.executeCommand("vscode.open", outputUri, vscode.ViewColumn.Beside);
    } else {
      vscode.window.showErrorMessage("Tile render failed. See Tile Builder output for details.");
    }
  });

  context.subscriptions.push(saveDisposable);
}

export function deactivate() {}
