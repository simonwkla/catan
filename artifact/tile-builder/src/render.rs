use std::path::Path;

use crate::{
    asset::AssetCache,
    scene::{Anchor, Item, Scene},
};

use color_eyre::eyre::{Context, Result};
use image::{
    Rgba, RgbaImage,
    imageops::{self, overlay},
};

pub struct Renderer {
    asset_cache: AssetCache,
}

impl Renderer {
    pub fn new(asset_cache: AssetCache) -> Self {
        Self { asset_cache }
    }

    fn apply_mask(&mut self, canvas: &mut RgbaImage, mask: &RgbaImage, mask_pos: (i32, i32)) {
        let (cw, ch) = canvas.dimensions();
        let (mw, mh) = mask.dimensions();
        let (ox, oy) = mask_pos;

        for y in 0..ch {
            for x in 0..cw {
                let mx = x as i32 - ox;
                let my = y as i32 - oy;

                let inside = mx >= 0 && my >= 0 && (mx as u32) < mw && (my as u32) < mh;

                if !inside {
                    *canvas.get_pixel_mut(x, y) = Rgba([0, 0, 0, 0]);
                    continue;
                }

                let a = mask.get_pixel(mx as u32, my as u32)[3];
                if a == 0 {
                    *canvas.get_pixel_mut(x, y) = Rgba([0, 0, 0, 0]);
                }
            }
        }
    }

    fn render_item(&mut self, canvas: &mut RgbaImage, item: &Item) -> Result<()> {
        let image = self.asset_cache.get(&item.asset)?;

        let (x, y) = item.position;

        let (x, y) = match item.anchor {
            Anchor::TopLeft => (x as i64, y as i64),
            Anchor::BottomCenter => {
                let (width, height) = image.dimensions();

                let center_x = width as i64 / 2;
                let offset_x = x as i64 - center_x;
                let offset_y = y as i64 - (height as i64);

                (offset_x, offset_y)
            }
        };

        if item.flipped {
            let flipped = imageops::flip_horizontal(image);
            overlay(canvas, &flipped, x, y);
        } else {
            overlay(canvas, image, x, y);
        }
        Ok(())
    }

    fn render(&mut self, scene: &mut Scene) -> Result<RgbaImage> {
        let mut canvas = RgbaImage::new(scene.canvas.width, scene.canvas.height);

        scene.sort_items();

        if let Some(ground) = &scene.ground {
            self.render_item(&mut canvas, ground)?;
        }

        for item in scene.items.iter() {
            self.render_item(&mut canvas, item)?;
        }

        if let Some(ground) = &scene.ground
            && scene.cfg.render_mask_active
        {
            // TODO: remove clone
            let ground_image = self.asset_cache.get(&ground.asset)?.clone();
            self.apply_mask(&mut canvas, &ground_image, ground.position);
        }

        // add border after mask is applied
        if let Some(border) = &scene.border {
            self.render_item(&mut canvas, border)?;
        }

        Ok(canvas)
    }

    pub fn render_to_file(&mut self, scene: &mut Scene, path: &Path) -> Result<()> {
        let img = self.render(scene)?;
        img.save(path)
            .wrap_err_with(|| format!("Failed to save image to file: {}", path.display()))
    }
}
