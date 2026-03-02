mod asset;
mod config;
mod render;
mod scene;

use std::path::PathBuf;

use color_eyre::eyre::{Context, Result};

use crate::{asset::AssetCache, config::Config, render::Renderer, scene::Scene};
fn main() -> Result<()> {
    color_eyre::install()?;

    let asset_root = PathBuf::from(".");
    let cfg_root = PathBuf::from(".");
    let output_dir = PathBuf::from("./output");

    let configs = Config::from_dir(&cfg_root).wrap_err_with(|| format!("Failed to parse configs: {}", cfg_root.display()))?;

    let scenes = configs.into_iter().map(|cfg| Scene::from_config(&cfg)).collect::<Vec<_>>();

    let mut renderer = Renderer::new(AssetCache::new(asset_root));

    for mut scene in scenes {
        renderer.render_to_file(&mut scene, &output_dir)?;
    }

    Ok(())
}
