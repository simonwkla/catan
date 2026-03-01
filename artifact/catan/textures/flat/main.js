import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** Regex for newlines (CRLF or LF). */
const RE_NEWLINE = /\r?\n/;
/** Regex for section header lines like "# SOMETHING". */
const RE_SECTION_HEADER = /^\s*#\s+\S+/;
/** Regex for "# BORDER" section header. */
const RE_BORDER_HEADER = /^\s*#\s+BORDER\s*$/;
/** Regex for trailing newline at end of string. */
const RE_TRAILING_NEWLINE = /\r?\n$/;

/**
 * Only these biome directories will be processed (and their subfolders).
 */
const POINTY_DIRS = [
  // 🌊 Water
  "pointy.ocean_small.blue",

  // 🌿 Valley
  "pointy.valley_lake.green",
  "pointy.valley_dense.green",

  // 🐊 Wetlands
  "pointy.swamp_dense.green",

  // 🌾 Plains / Fields
  "pointy.meadow_dense.green",
  "pointy.wheat_dense.green",

  // 🌲 Forests
  "pointy.oak_forest_sparse.green",
  "pointy.oak_forest_dense.green",
  "pointy.pine_forest_dense.green",
  "pointy.mixed_forest_dense.green",
  "pointy.jungle_forest_dense.green",

  // ⛰ Hills & Mountains
  "pointy.hills_dense.green",
  "pointy.mountain_valley.green",
  "pointy.mountain_clouds.white",

  // 🏜 Desert
  "pointy.desert_clearing.yellow",
];

/**
 * Removes the "# BORDER" section:
 * - delete the line "# BORDER"
 * - delete following lines until the next section header "# SOMETHING" or EOF
 */
export function removeBorderSection(text) {
  const lines = text.split(RE_NEWLINE);

  const out = [];
  let skipping = false;

  for (const line of lines) {
    const isHeader = RE_SECTION_HEADER.test(line);
    const isBorderHeader = RE_BORDER_HEADER.test(line);

    if (isBorderHeader) {
      skipping = true;
      continue;
    }

    if (skipping && isHeader) {
      skipping = false; // stop skipping at next header
    }

    if (!skipping) {
      out.push(line);
    }
  }

  const hadTrailingNewline = RE_TRAILING_NEWLINE.test(text);
  const result = out.join("\n");
  return hadTrailingNewline ? `${result}\n` : result;
}

/**
 * Additional biome-specific filtering
 */
function applyBiomeSpecificRules(text, biomeDirName) {
  // Desert rule: remove any line containing palm_trees.green
  if (biomeDirName === "pointy.desert_clearing.yellow") {
    return text
      .split(RE_NEWLINE)
      .filter((line) => !line.includes("palm_trees.green"))
      .join("\n");
  }

  return text;
}

function isTxt(name) {
  return path.extname(name).toLowerCase() === ".txt";
}

/**
 * Recursively copy .txt files, preserving structure, applying transform.
 */
async function copyTxtRecursiveFiltered(sourceDir, targetDir, biomeDirName) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await mkdir(targetPath, { recursive: true });
      await copyTxtRecursiveFiltered(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile() && isTxt(entry.name)) {
      await mkdir(path.dirname(targetPath), { recursive: true });

      let content = await readFile(sourcePath, "utf8");

      // Remove border section
      content = removeBorderSection(content);
      // Apply biome-specific filtering
      content = applyBiomeSpecificRules(content, biomeDirName);

      await writeFile(targetPath, content, "utf8");
    }
  }
}

/**
 * Main: only run over POINTY_DIRS
 */
export async function copyPointyTxtFiles({ srcRoot, destRoot }) {
  await rm(destRoot, {
    force: true,
    recursive: true,
  });

  for (const dir of POINTY_DIRS) {
    const srcPath = path.join(srcRoot, dir);
    const destPath = path.join(destRoot, dir);

    await mkdir(destPath, { recursive: true });
    await copyTxtRecursiveFiltered(srcPath, destPath, dir);
  }
}

/**
 * CLI:
 * node copyPointyTxt.mjs ./src ./dest
 */
const srcRoot = process.argv[2] ?? "./src/HexMapMaker/Tiles/Isle of Lore 2";
const destRoot = process.argv[3] ?? "./src/HexMapMaker/Workbench/Tiles";

copyPointyTxtFiles({ srcRoot, destRoot })
  .then(() => {
    const child = spawn("./tile-builder-win-final/TileBuilder.exe", [], {
      stdio: "inherit",
    });

    child.on("close", (_code) => {});
  })
  .catch((_err) => {
    process.exitCode = 1;
  });
