mod asset;
mod config;
mod render;
mod scene;

use std::path::PathBuf;

use clap::Parser;
use color_eyre::eyre::{self, Context, Result};
use serde::Deserialize;

use crate::{asset::AssetCache, config::Config, render::Renderer, scene::Scene};

#[derive(Parser)]
#[command(about = "Renders tile scenes from config files")]
struct Cli {
    /// Path to a JSON config file with asset_root, cfg_root, output_dir, and optional overrides
    #[arg(long)]
    config: PathBuf,

    /// Single-file mode: path to a .tile.txt file to render (requires --output)
    #[arg(long)]
    input: Option<PathBuf>,

    /// Single-file mode: path where the rendered PNG will be written (requires --input)
    #[arg(long)]
    output: Option<PathBuf>,
}

#[derive(Deserialize, Default)]
struct FileConfig {
    asset_root: Option<PathBuf>,
    cfg_root: Option<PathBuf>,
    output_dir: Option<PathBuf>,
    #[serde(default)]
    render_mask_active: Option<bool>,
    #[serde(default)]
    border_active: Option<bool>,
}

impl FileConfig {
    fn load(path: &PathBuf) -> Result<Self> {
        let contents = std::fs::read_to_string(path)
            .wrap_err_with(|| format!("Failed to read config file: {}", path.display()))?;
        let mut cfg: FileConfig = serde_json::from_str(&contents)
            .wrap_err_with(|| format!("Failed to parse config file: {}", path.display()))?;

        let config_dir = path
            .parent()
            .ok_or_else(|| eyre::eyre!("config path has no parent: {}", path.display()))?;

        if let Some(ref p) = cfg.asset_root {
            cfg.asset_root = Some(config_dir.join(p));
        }
        if let Some(ref p) = cfg.cfg_root {
            cfg.cfg_root = Some(config_dir.join(p));
        }
        if let Some(ref p) = cfg.output_dir {
            cfg.output_dir = Some(config_dir.join(p));
        }

        Ok(cfg)
    }
}

fn main() -> Result<()> {
    color_eyre::install()?;

    let cli = Cli::parse();

    match (&cli.input, &cli.output) {
        (Some(_), None) | (None, Some(_)) => {
            return Err(eyre::eyre!("--input and --output must be used together"));
        }
        _ => {}
    }

    let file_cfg = FileConfig::load(&cli.config)?;

    let asset_root = file_cfg
        .asset_root
        .ok_or_else(|| eyre::eyre!("missing asset_root in config file"))?;

    let overrides = scene::GlobalOverrides {
        render_mask_active: file_cfg.render_mask_active,
        border_active: file_cfg.border_active,
    };

    let mut renderer = Renderer::new(AssetCache::new(asset_root));

    if let (Some(input), Some(output)) = (cli.input.as_ref(), cli.output.as_ref()) {
        // Single-file mode
        let tile_cfg = Config::from_file(input)
            .wrap_err_with(|| format!("Failed to parse tile file: {}", input.display()))?;
        let mut scene = Scene::from_config(&tile_cfg, &overrides);
        renderer.render_to_path(&mut scene, output)?;
    } else {
        // Batch mode
        let cfg_root = file_cfg
            .cfg_root
            .ok_or_else(|| eyre::eyre!("missing cfg_root in config file"))?;
        let output_dir = file_cfg
            .output_dir
            .ok_or_else(|| eyre::eyre!("missing output_dir in config file"))?;

        let configs = Config::from_dir(&cfg_root)
            .wrap_err_with(|| format!("Failed to parse configs: {}", cfg_root.display()))?;

        let scenes = configs
            .into_iter()
            .map(|cfg| Scene::from_config(&cfg, &overrides))
            .collect::<Vec<_>>();

        for mut scene in scenes {
            renderer.render_to_dir(&mut scene, &output_dir)?;
        }
    }

    Ok(())
}
