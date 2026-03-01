import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

/**
 * Biome-ordered, deduplicated list
 */
const POINTY_DIRS = [
  // Water
  "pointy.ocean_small.blue",

  // Valley
  "pointy.valley_lake.green",
  "pointy.valley_dense.green",

  // Wetlands
  "pointy.swamp_dense.green",

  // Pasture
  "pointy.meadow_dense.green",
  "pointy.hills_dense.green",

  // Wheat
  "pointy.wheat_dense.green",

  // Forests
  "pointy.oak_forest_sparse.green",
  "pointy.oak_forest_dense.green",
  "pointy.pine_forest_dense.green",
  "pointy.mixed_forest_dense.green",
  "pointy.jungle_forest_dense.green",

  // Mountains
  "pointy.mountain_valley.green",
  "pointy.mountain_clouds.white",

  // Desert
  "pointy.desert_clearing.yellow",
];

/**
 * Convert:
 * pointy.jungle_forest_dense.green
 * -> jungle-forest-dense
 */
function toBiomeFolderName(pointyName) {
  let s = pointyName.trim();

  if (s.startsWith("pointy.")) {
    s = s.slice("pointy.".length);
  }

  // remove trailing ".color"
  const lastDot = s.lastIndexOf(".");
  if (lastDot !== -1) {
    s = s.slice(0, lastDot);
  }

  return s.replaceAll("_", "-");
}

function isPng(name) {
  return path.extname(name).toLowerCase() === ".png";
}

/**
 * Copy + number PNGs inside one directory (non-recursive)
 */
async function copyAndNumberPngsInFolder(srcFolder, destFolder) {
  const entries = await readdir(srcFolder, { withFileTypes: true });

  const pngFiles = entries
    .filter((e) => e.isFile() && isPng(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  if (pngFiles.length === 0) {
    return;
  }

  await mkdir(destFolder, { recursive: true });

  for (let i = 0; i < Math.min(4, pngFiles.length); i++) {
    const srcPath = path.join(srcFolder, pngFiles[i]);
    const destPath = path.join(destFolder, `${i}.png`);
    await copyFile(srcPath, destPath);
  }
}

/**
 * Recursively walk directory tree
 * Preserve structure
 * Number PNGs per folder
 */
async function walkAndCopyNumberedPngs(srcRoot, destRoot) {
  // First copy PNGs in this folder
  await copyAndNumberPngsInFolder(srcRoot, destRoot);

  // Then recurse into subdirectories
  const entries = await readdir(srcRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const nextSrc = path.join(srcRoot, entry.name);
    const nextDest = path.join(destRoot, entry.name);

    await walkAndCopyNumberedPngs(nextSrc, nextDest);
  }
}

/**
 * Main function
 */
export async function copyPointyBiomePngs({ srcRoot, destRoot }) {
  for (const pointyDir of POINTY_DIRS) {
    const biomeFolder = toBiomeFolderName(pointyDir);

    const srcPath = path.join(srcRoot, pointyDir);
    const destPath = path.join(destRoot, biomeFolder);

    await rm(destPath, { recursive: true, force: true });

    await walkAndCopyNumberedPngs(srcPath, destPath);
  }
}

/**
 * CLI usage:
 * node copyPointyPngs.mjs ./assets ./output
 */
const srcRoot = process.argv[2] ?? "./src/HexMapMaker/Workbench/Tiles";
const destRoot = process.argv[3] ?? "../../public/textures/flat";

copyPointyBiomePngs({ srcRoot, destRoot })
  .then(() => {})
  .catch((_err) => {
    process.exitCode = 1;
  });
