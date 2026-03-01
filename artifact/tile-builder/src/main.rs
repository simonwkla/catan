mod asset;
mod config;
mod render;
mod scene;

use std::path::Path;

use color_eyre::eyre::{Context, Result};

use crate::{asset::AssetCache, config::Config, render::Renderer, scene::Scene};
fn main() -> Result<()> {
    color_eyre::install()?;

    let file_name = "city_clearing_0.tile.txt";

    let file = std::fs::File::open(file_name)
        .wrap_err_with(|| format!("Failed to open file: {}", file_name))?;

    let config = Config::from_reader(file_name, file)
        .wrap_err_with(|| format!("Failed to parse config: {}", file_name))?;

    let mut scene = Scene::from_config(&config);

    let mut renderer = Renderer::new(AssetCache::default());

    renderer
        .render_to_file(&mut scene, &Path::new("output.png"))
        .wrap_err_with(|| format!("Failed to render scene: {}", file_name))?;

    // print scene
    println!("{:#?}", scene);

    Ok(())
}
