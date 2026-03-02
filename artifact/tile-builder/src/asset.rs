use std::{collections::HashMap, path::PathBuf};

use color_eyre::eyre::{Context, Result};
use image::RgbaImage;

use crate::scene::AssetRef;

#[derive(Default)]
pub struct AssetCache {
    asset_root: PathBuf,
    images: HashMap<PathBuf, RgbaImage>,
}

impl AssetCache {
    pub fn new(asset_root: PathBuf) -> Self {
        Self {
            asset_root,
            images: HashMap::new(),
        }
    }
}

impl AssetCache {
    pub fn get(&mut self, asset: &AssetRef) -> Result<&RgbaImage> {
        if !self.images.contains_key(&asset.path) {
            let img = image::open(self.asset_root.join(&asset.path))
                .wrap_err_with(|| format!("Failed to open image: {}", asset.path.display()))?
                .to_rgba8();

            self.images.insert(asset.path.clone(), img);
        }

        Ok(self.images.get(&asset.path).unwrap())
    }
}
