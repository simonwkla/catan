use std::path::PathBuf;

use crate::config;

/// Global overrides from the tile-builder config file.
#[derive(Debug, Default)]
pub struct GlobalOverrides {
    pub render_mask_active: Option<bool>,
    pub border_active: Option<bool>,
}

#[derive(Debug)]
pub struct Scene {
    pub canvas: Canvas,
    pub cfg: Cfg,
    pub ground: Option<Item>,
    pub border: Option<Item>,
    pub items: Vec<Item>,
}

impl Scene {
    pub fn from_config(config: &config::Config, overrides: &GlobalOverrides) -> Self {
        let canvas = Canvas::new(config.canvas.width, config.canvas.height);

        let items = config
            .elements
            .iter()
            .map(|element| Item::from(element))
            .collect::<Vec<_>>();

        let ground = config
            .ground
            .as_ref()
            .filter(|ground| ground.render)
            .map(|ground| Item::from(ground));

        let per_tile_render_mask = config
            .render_mask
            .as_ref()
            .map(|x| x.active)
            .unwrap_or(true);
        let render_mask_active = overrides.render_mask_active.unwrap_or(per_tile_render_mask);

        let border = if overrides.border_active == Some(false) {
            None
        } else {
            config.border.as_ref().map(|border| Item::from(border))
        };

        Self {
            canvas,
            ground,
            border,
            items,
            cfg: Cfg {
                source_id: config.source_id.clone(),
                render_mask_active,
                tile_type: config.tile_type.clone(),
            },
        }
    }

    // sort the items by: layer, sort and then y value
    pub fn sort_items(&mut self) {
        self.items
            .sort_by_key(|item| (item.layer, item.sort, item.position.1));
    }
}

#[derive(Debug)]
pub struct Item {
    pub asset: AssetRef,
    pub layer: Layer,
    pub position: (i32, i32),
    pub anchor: Anchor,
    pub flipped: bool,
    pub sort: u32,
}

#[derive(Debug)]
pub enum Anchor {
    TopLeft,
    BottomCenter,
}

impl From<&config::Element> for Item {
    fn from(element: &config::Element) -> Self {
        Self {
            asset: AssetRef::from(format!("elements/{}", element.id).as_str()),
            layer: Layer::from(&element.layer),
            position: element.position,
            anchor: Anchor::BottomCenter,
            flipped: element.flipped,
            sort: element.sort,
        }
    }
}

impl From<&config::Border> for Item {
    fn from(border: &config::Border) -> Self {
        Self {
            asset: AssetRef::from(format!("borders/{}", border.id).as_str()),
            layer: Layer(4),
            position: border.position,
            anchor: Anchor::TopLeft,
            flipped: false,
            sort: 0,
        }
    }
}

impl From<&config::Ground> for Item {
    fn from(ground: &config::Ground) -> Self {
        Self {
            asset: AssetRef::from(format!("grounds/{}", ground.id).as_str()),
            layer: Layer(0),
            position: ground.position,
            anchor: Anchor::TopLeft,
            flipped: false,
            sort: 0,
        }
    }
}

#[derive(Debug)]
pub struct AssetRef {
    pub path: PathBuf,
}

impl From<&str> for AssetRef {
    fn from(path: &str) -> Self {
        // normalize separators
        let s = path.replace('\\', std::path::MAIN_SEPARATOR_STR);

        let p = PathBuf::from(s);

        let mut rel = p
            .components()
            .filter(|c| matches!(c, std::path::Component::Normal(_)))
            .collect::<PathBuf>();

        rel.set_extension("png");

        Self { path: rel }
    }
}

#[derive(Debug)]
pub struct Canvas {
    pub width: u32,
    pub height: u32,
}

impl Canvas {
    pub fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }
}

#[derive(Debug, PartialEq, PartialOrd, Ord, Eq, Copy, Clone)]
pub struct Layer(u32);

impl From<&config::Layer> for Layer {
    fn from(layer: &config::Layer) -> Self {
        match layer {
            config::Layer::Ground => Self(1),
            config::Layer::Main => Self(2),
            config::Layer::Air => Self(3),
        }
    }
}

#[derive(Debug)]
pub struct Cfg {
    pub render_mask_active: bool,
    pub source_id: String,
    pub tile_type: String,
}
