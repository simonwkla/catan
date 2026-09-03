#!/usr/bin/env python3
"""Build clean point-up CATAN fifth-edition textures with upright artwork."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Final, Iterable, cast

from PIL import Image, ImageChops, ImageDraw, ImageFont

OUTPUT_SIZE: Final = (384, 444)
MORPH_MESH_CELL: Final = 8
MASK_SUPERSAMPLE: Final = 4
WEBP_QUALITY: Final = 90
EXPECTED_TERRAINS: Final = {"water", "desert", "sheep", "forest", "field", "mountain", "clay", "gold"}

PACK_ROOT: Final = Path(__file__).resolve().parent
REPOSITORY_ROOT: Final = PACK_ROOT.parent.parent
SOURCE_ROOT: Final = PACK_ROOT / "source"
ENHANCED_ROOT: Final = PACK_ROOT / "enhanced"
SOURCE_MANIFEST_PATH: Final = PACK_ROOT / "source-manifest.json"
MASTER_ROOT: Final = PACK_ROOT / "tiles"
QA_ROOT: Final = PACK_ROOT / "qa"
PUBLIC_ROOT: Final = REPOSITORY_ROOT / "artifact/catan/public/textures/catan-fifth-edition/tiles"
OUTPUT_MANIFEST_PATH: Final = PACK_ROOT / "manifest.json"


@dataclass(frozen=True)
class SourceItem:
    id: str
    application_type: str
    official_terrain: str
    source_set: str
    source_page_url: str
    original_image_url: str
    downloaded_filename: str
    source_dimensions: tuple[int, int]
    source_sha256: str
    output_stem: str


@dataclass(frozen=True)
class ProcessedTile:
    source: SourceItem
    enhanced_path: Path
    enhanced_sha256: str
    enhanced_dimensions: tuple[int, int]
    image: Image.Image
    detected_box: tuple[int, int, int, int]
    crop_box: tuple[int, int, int, int]
    prepared_size: tuple[int, int]
    png_path: Path
    webp_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    _ = parser.add_argument(
        "--check",
        action="store_true",
        help="Validate local sources and generated outputs without rewriting files",
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def repository_path(path: Path) -> str:
    return path.relative_to(REPOSITORY_ROOT).as_posix()


def load_sources() -> tuple[dict[str, Any], list[SourceItem]]:
    with SOURCE_MANIFEST_PATH.open(encoding="utf-8") as manifest_file:
        manifest = cast(dict[str, Any], json.load(manifest_file))

    items = [
        SourceItem(
            id=item["id"],
            application_type=item["applicationType"],
            official_terrain=item["officialTerrain"],
            source_set=item["sourceSet"],
            source_page_url=item["sourcePageUrl"],
            original_image_url=item["originalImageUrl"],
            downloaded_filename=item["downloadedFilename"],
            source_dimensions=tuple(item["sourceDimensions"]),
            source_sha256=item["sourceSha256"],
            output_stem=item["outputStem"],
        )
        for item in manifest["items"]
    ]

    terrains = {item.application_type for item in items}
    if terrains != EXPECTED_TERRAINS:
        missing = sorted(EXPECTED_TERRAINS - terrains)
        extra = sorted(terrains - EXPECTED_TERRAINS)
        raise ValueError(f"Source manifest terrain mismatch; missing={missing}, extra={extra}")
    if len({item.id for item in items}) != len(items):
        raise ValueError("Source manifest contains duplicate item ids")
    if len({(item.application_type, item.output_stem) for item in items}) != len(items):
        raise ValueError("Source manifest contains duplicate output paths")
    return manifest, items


def validate_source(item: SourceItem) -> Image.Image:
    path = SOURCE_ROOT / item.downloaded_filename
    if not path.is_file():
        raise FileNotFoundError(f"Missing local source image: {path}")
    source_sha256 = sha256_file(path)
    if source_sha256 != item.source_sha256:
        raise ValueError(
            f"Source hash mismatch for {item.downloaded_filename}: "
            f"expected {item.source_sha256}, got {source_sha256}"
        )
    image = Image.open(path).convert("RGB")
    if image.size != item.source_dimensions:
        raise ValueError(
            f"Source dimensions mismatch for {item.downloaded_filename}: "
            f"expected {item.source_dimensions}, got {image.size}"
        )
    return image


def validate_enhanced(item: SourceItem) -> tuple[Path, str, Image.Image]:
    path = ENHANCED_ROOT / Path(item.downloaded_filename).with_suffix(".png").name
    if not path.is_file():
        raise FileNotFoundError(f"Missing enhanced source image: {path}")
    image = Image.open(path).convert("RGB")
    if image.width < 1024 or image.height < 1024:
        raise ValueError(f"Enhanced source is unexpectedly small: {path} ({image.size})")
    return path, sha256_file(path), image


def detected_tile_box(image: Image.Image) -> tuple[int, int, int, int]:
    red, green, blue = image.split()
    maximum = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    minimum = ImageChops.darker(ImageChops.darker(red, green), blue)
    chroma = ImageChops.subtract(maximum, minimum)
    # Generated exteriors may be white or a baked gray checkerboard. Both are
    # achromatic, while the warm tile rim is strongly chromatic and connected.
    foreground = chroma.point([255 if value >= 18 else 0 for value in range(256)])
    box = foreground.getbbox()
    if box is None:
        raise ValueError("Could not detect the centered tile")

    width = box[2] - box[0]
    height = box[3] - box[1]
    expected_ratio = 2 / math.sqrt(3)
    if width * height < image.width * image.height * 0.75:
        raise ValueError(f"Detected tile is unexpectedly small: {box}")
    # Image-to-image remasters can vary the photographed hex's proportions by a
    # few percent. The subsequent geometric normalization corrects that small
    # drift consistently for every runtime tile.
    if abs(width / height / expected_ratio - 1) > 0.09:
        raise ValueError(f"Detected tile is not recognizably flat-top: {box}")
    return box


def expanded_box(box: tuple[int, int, int, int], image_size: tuple[int, int], padding: int = 1) -> tuple[int, int, int, int]:
    return (
        max(0, box[0] - padding),
        max(0, box[1] - padding),
        min(image_size[0], box[2] + padding),
        min(image_size[1], box[3] + padding),
    )


def regular_hex_mask(size: tuple[int, int], orientation: str, inset: float = 0) -> Image.Image:
    width, height = size
    scale = MASK_SUPERSAMPLE
    large_width = width * scale
    large_height = height * scale
    inset_x = inset * scale
    inset_y = inset * scale
    center_x = large_width / 2
    center_y = large_height / 2
    factor_x = (large_width - 2 * inset_x) / large_width
    factor_y = (large_height - 2 * inset_y) / large_height

    if orientation == "flat-top":
        base_points = (
            (large_width / 4, 0),
            (3 * large_width / 4, 0),
            (large_width, large_height / 2),
            (3 * large_width / 4, large_height),
            (large_width / 4, large_height),
            (0, large_height / 2),
        )
    elif orientation == "point-up":
        base_points = (
            (large_width / 2, 0),
            (large_width, large_height / 4),
            (large_width, 3 * large_height / 4),
            (large_width / 2, large_height),
            (0, 3 * large_height / 4),
            (0, large_height / 4),
        )
    else:
        raise ValueError(f"Unknown hex orientation: {orientation}")

    points = tuple(
        (
            center_x + (x - center_x) * factor_x,
            center_y + (y - center_y) * factor_y,
        )
        for x, y in base_points
    )
    mask = Image.new("L", (large_width, large_height), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)


def hex_boundary_radius(theta: float, orientation: str) -> float:
    # Regular-hex apothem for circumradius 1. Side normals are offset by 30°
    # between the two orientations.
    normal_offset = 0.0 if orientation == "point-up" else math.pi / 6
    normal_step = math.pi / 3
    nearest_normal = normal_offset + round((theta - normal_offset) / normal_step) * normal_step
    delta = math.atan2(math.sin(theta - nearest_normal), math.cos(theta - nearest_normal))
    return math.cos(math.pi / 6) / math.cos(delta)


def morph_flat_top_to_point_up(image: Image.Image, output_size: tuple[int, int]) -> Image.Image:
    source_width, source_height = image.size
    output_width, output_height = output_size
    source_radius = source_width / 2
    output_radius = output_height / 2
    source_center = (source_width / 2, source_height / 2)
    output_center = (output_width / 2, output_height / 2)

    def source_point(x: float, y: float) -> tuple[float, float]:
        normalized_x = (x - output_center[0]) / output_radius
        normalized_y = (y - output_center[1]) / output_radius
        radius = math.hypot(normalized_x, normalized_y)
        if radius < 1e-9:
            return source_center
        theta = math.atan2(normalized_y, normalized_x)
        radial_fraction = radius / hex_boundary_radius(theta, "point-up")
        source_boundary = hex_boundary_radius(theta, "flat-top")
        source_distance = radial_fraction * source_boundary * source_radius
        return (
            min(source_width - 1, max(0, source_center[0] + math.cos(theta) * source_distance)),
            min(source_height - 1, max(0, source_center[1] + math.sin(theta) * source_distance)),
        )

    mesh: list[tuple[tuple[int, int, int, int], tuple[float, ...]]] = []
    for top in range(0, output_height, MORPH_MESH_CELL):
        bottom = min(output_height, top + MORPH_MESH_CELL)
        for left in range(0, output_width, MORPH_MESH_CELL):
            right = min(output_width, left + MORPH_MESH_CELL)
            upper_left = source_point(left, top)
            lower_left = source_point(left, bottom)
            lower_right = source_point(right, bottom)
            upper_right = source_point(right, top)
            mesh.append(((left, top, right, bottom), (*upper_left, *lower_left, *lower_right, *upper_right)))

    return image.transform(output_size, Image.Transform.MESH, mesh, resample=Image.Resampling.BICUBIC)


def normalize_tile(
    image: Image.Image,
) -> tuple[Image.Image, tuple[int, int, int, int], tuple[int, int, int, int], tuple[int, int]]:
    detected_box = detected_tile_box(image)
    crop_box = expanded_box(detected_box, image.size)
    crop = image.crop(crop_box).convert("RGB")
    prepared_size = crop.size
    normalized = morph_flat_top_to_point_up(crop, OUTPUT_SIZE).convert("RGBA")
    point_mask = regular_hex_mask(OUTPUT_SIZE, "point-up")
    normalized.putalpha(point_mask)

    corner_alpha = tuple(normalized.getpixel(point)[3] for point in ((0, 0), (383, 0), (0, 443), (383, 443)))
    if corner_alpha != (0, 0, 0, 0):
        raise ValueError(f"Output corners are not fully transparent: {corner_alpha}")
    return normalized, detected_box, crop_box, prepared_size


def save_tile(item: SourceItem, enhanced_path: Path, enhanced_sha256: str, image: Image.Image) -> ProcessedTile:
    normalized, detected_box, crop_box, prepared_size = normalize_tile(image)
    png_path = MASTER_ROOT / item.application_type / f"{item.output_stem}.png"
    webp_path = PUBLIC_ROOT / item.application_type / f"{item.output_stem}.webp"
    png_path.parent.mkdir(parents=True, exist_ok=True)
    webp_path.parent.mkdir(parents=True, exist_ok=True)
    normalized.save(png_path, format="PNG", optimize=True, compress_level=9)
    normalized.save(webp_path, format="WEBP", quality=WEBP_QUALITY, method=6, exact=True)
    return ProcessedTile(
        item,
        enhanced_path,
        enhanced_sha256,
        image.size,
        normalized,
        detected_box,
        crop_box,
        prepared_size,
        png_path,
        webp_path,
    )


def label_font() -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    for path in (
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ):
        if path.is_file():
            return ImageFont.truetype(str(path), 15)
    return ImageFont.load_default()


def save_contact_sheet(results: Iterable[ProcessedTile], path: Path, background: str, foreground: str) -> None:
    tiles = list(results)
    columns = 5
    thumb_size = (144, 167)
    padding = 18
    label_height = 28
    rows = math.ceil(len(tiles) / columns)
    cell_width = thumb_size[0] + padding * 2
    cell_height = thumb_size[1] + label_height + padding * 2
    sheet = Image.new("RGBA", (cell_width * columns, cell_height * rows), background)
    draw = ImageDraw.Draw(sheet)
    font = label_font()

    for index, result in enumerate(tiles):
        column = index % columns
        row = index // columns
        left = column * cell_width + padding
        top = row * cell_height + padding
        thumbnail = result.image.resize(thumb_size, Image.Resampling.LANCZOS)
        sheet.alpha_composite(thumbnail, (left, top))
        label = f"{result.source.application_type}/{result.source.output_stem}"
        label_box = draw.textbbox((0, 0), label, font=font)
        label_width = label_box[2] - label_box[0]
        draw.text(
            (column * cell_width + (cell_width - label_width) / 2, top + thumb_size[1] + 8),
            label,
            fill=foreground,
            font=font,
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(path, format="PNG", optimize=True, compress_level=9)


def output_record(result: ProcessedTile) -> dict[str, Any]:
    corner_alpha = [
        result.image.getpixel(point)[3]
        for point in ((0, 0), (OUTPUT_SIZE[0] - 1, 0), (0, OUTPUT_SIZE[1] - 1), (OUTPUT_SIZE[0] - 1, OUTPUT_SIZE[1] - 1))
    ]
    return {
        "id": result.source.id,
        "applicationType": result.source.application_type,
        "officialTerrain": result.source.official_terrain,
        "sourceSet": result.source.source_set,
        "sourcePageUrl": result.source.source_page_url,
        "originalImageUrl": result.source.original_image_url,
        "originalSource": {
            "path": repository_path(SOURCE_ROOT / result.source.downloaded_filename),
            "dimensions": list(result.source.source_dimensions),
            "sha256": result.source.source_sha256,
            "perspectiveCorrection": "none",
            "colorCorrection": "none",
        },
        "enhancement": {
            "path": repository_path(result.enhanced_path),
            "dimensions": list(result.enhanced_dimensions),
            "sha256": result.enhanced_sha256,
            "generator": "OpenAI built-in image generation, image-to-image faithful remaster",
            "prompt": repository_path(PACK_ROOT / "prompts/faithful-remaster.md"),
            "detectedTileBounds": list(result.detected_box),
            "cropBounds": list(result.crop_box),
        },
        "transform": {
            "sourceOrientation": "flat-top",
            "artworkOrientation": "upright, preserved from enhanced source",
            "rotationDegreesCounterClockwise": 0,
            "geometry": "radial flat-top to point-up hex morph",
            "landRim": "original enhanced rim remapped with tile geometry",
            "preparedCropDimensions": list(result.prepared_size),
            "outputOrientation": "point-up",
            "outputDimensions": list(OUTPUT_SIZE),
            "alphaMask": "4x supersampled anti-aliased regular point-up hex",
        },
        "master": {
            "path": repository_path(result.png_path),
            "sha256": sha256_file(result.png_path),
            "pixelSha256": pixel_sha256(result.image),
        },
        "runtime": {
            "path": repository_path(result.webp_path),
            "sha256": sha256_file(result.webp_path),
            "format": "WebP",
            "quality": WEBP_QUALITY,
        },
        "cornerAlpha": corner_alpha,
    }


def expected_output_paths(items: Iterable[SourceItem]) -> list[Path]:
    paths: list[Path] = []
    for item in items:
        paths.extend(
            (
                MASTER_ROOT / item.application_type / f"{item.output_stem}.png",
                PUBLIC_ROOT / item.application_type / f"{item.output_stem}.webp",
            )
        )
    paths.extend((QA_ROOT / "contact-sheet-light.png", QA_ROOT / "contact-sheet-dark.png", OUTPUT_MANIFEST_PATH))
    return paths


def check_outputs(items: list[SourceItem]) -> None:
    for item in items:
        _ = validate_source(item)
        _ = validate_enhanced(item)
    missing = [path for path in expected_output_paths(items) if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing generated outputs:\n" + "\n".join(str(path) for path in missing))

    with OUTPUT_MANIFEST_PATH.open(encoding="utf-8") as manifest_file:
        manifest = cast(dict[str, Any], json.load(manifest_file))
    records = {record["id"]: record for record in manifest["tiles"]}
    if set(records) != {item.id for item in items}:
        raise ValueError("Generated manifest does not match the source manifest")

    for item in items:
        record = records[item.id]
        png_path = REPOSITORY_ROOT / record["master"]["path"]
        webp_path = REPOSITORY_ROOT / record["runtime"]["path"]
        if sha256_file(png_path) != record["master"]["sha256"]:
            raise ValueError(f"PNG hash mismatch: {png_path}")
        if sha256_file(webp_path) != record["runtime"]["sha256"]:
            raise ValueError(f"WebP hash mismatch: {webp_path}")
        with Image.open(png_path) as image:
            rgba = image.convert("RGBA")
            if rgba.size != OUTPUT_SIZE:
                raise ValueError(f"PNG dimensions mismatch: {png_path}")
            if [rgba.getpixel(point)[3] for point in ((0, 0), (383, 0), (0, 443), (383, 443))] != [0, 0, 0, 0]:
                raise ValueError(f"PNG corners are not transparent: {png_path}")


def build(source_manifest: dict[str, Any], items: list[SourceItem]) -> None:
    results: list[ProcessedTile] = []
    for item in items:
        _ = validate_source(item)
        enhanced_path, enhanced_sha256, enhanced_image = validate_enhanced(item)
        results.append(save_tile(item, enhanced_path, enhanced_sha256, enhanced_image))
    pixel_hashes = [pixel_sha256(result.image) for result in results]
    if len(set(pixel_hashes)) != len(pixel_hashes):
        raise ValueError("Two normalized variants are exact duplicates; deduplicate the source manifest")

    light_sheet = QA_ROOT / "contact-sheet-light.png"
    dark_sheet = QA_ROOT / "contact-sheet-dark.png"
    save_contact_sheet(results, light_sheet, "#f3f0e8", "#1c2026")
    save_contact_sheet(results, dark_sheet, "#141920", "#f5f0e8")

    output_manifest = {
        "schemaVersion": 1,
        "packId": source_manifest["packId"],
        "identifiedEdition": source_manifest["identifiedEdition"],
        "outputDimensions": list(OUTPUT_SIZE),
        "outputAspectRatio": "32:37",
        "outputOrientation": "point-up",
        "runtimeFormat": {"format": "WebP", "quality": WEBP_QUALITY},
        "qa": {
            "lightContactSheet": repository_path(light_sheet),
            "darkContactSheet": repository_path(dark_sheet),
        },
        "tiles": [output_record(result) for result in results],
    }
    OUTPUT_MANIFEST_PATH.write_text(json.dumps(output_manifest, indent=2) + "\n", encoding="utf-8")
    check_outputs(items)


def main() -> None:
    args = parse_args()
    source_manifest, items = load_sources()
    if args.check:
        check_outputs(items)
        print(f"Validated {len(items)} source/master/runtime tile sets")
        return
    build(source_manifest, items)
    print(f"Built {len(items)} point-up tiles for all {len(EXPECTED_TERRAINS)} terrain types")


if __name__ == "__main__":
    main()
