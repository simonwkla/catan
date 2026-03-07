#[path = "config-txt.rs"]
mod config_txt;
#[path = "config-yaml.rs"]
mod config_yaml;

use std::path::Path;

use color_eyre::eyre::{Context, Result, eyre};

pub trait ConfigParser {
    fn from_str(source_id: &str, tile_type: &str, input: &str) -> Result<Config>;
}

#[derive(Debug)]
pub struct Config {
    pub canvas: Canvas,
    pub render_mask: Option<RenderMask>,
    pub ground: Option<Ground>,
    pub border: Option<Border>,
    pub elements: Vec<Element>,
    pub source_id: String,
    pub tile_type: String,
}

#[derive(Debug)]
pub struct Canvas {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug)]
pub struct RenderMask {
    pub active: bool,
}

#[derive(Debug)]
pub struct Ground {
    pub id: String,
    pub position: (i32, i32),
    pub render: bool,
}

#[derive(Debug)]
pub struct Element {
    pub id: String,
    pub layer: Layer,
    pub position: (i32, i32),
    pub flipped: bool,
    pub sort: u32,
}

#[derive(Debug)]
pub struct Border {
    pub id: String,
    pub position: (i32, i32),
}

#[derive(Debug)]
pub enum Layer {
    Ground,
    Main,
    Air,
}

const EXTENSION_TXT: &str = ".tile.txt";
const EXTENSION_YML: &str = ".tile.yml";

fn is_tile_file(name: &str) -> bool {
    name.ends_with(EXTENSION_TXT) || name.ends_with(EXTENSION_YML)
}

impl Config {
    pub fn from_file(path: &Path) -> Result<Self> {
        let file_name = path
            .file_name()
            .ok_or_else(|| eyre!("Failed to get file name: {}", path.display()))?
            .to_string_lossy()
            .to_string();

        let tile_type = path
            .parent()
            .ok_or_else(|| eyre!("Failed to get parent directory: {}", path.display()))?
            .file_name()
            .ok_or_else(|| eyre!("Failed to get file name: {}", path.display()))?
            .to_string_lossy()
            .to_string();

        let buf = std::fs::read_to_string(path)
            .wrap_err_with(|| format!("Failed to read file: {}", path.display()))?;

        if path
            .file_name()
            .map_or(false, |n| n.to_string_lossy().ends_with(EXTENSION_YML))
        {
            config_yaml::YamlConfig::from_str(&file_name, &tile_type, &buf)
        } else {
            config_txt::TxtConfig::from_str(&file_name, &tile_type, &buf)
        }
    }

    pub fn from_dir(path: &Path) -> Result<Vec<Self>> {
        let mut cfgs = Vec::new();

        let walker = walkdir::WalkDir::new(path).into_iter();

        for entry in walker {
            let entry = entry?;
            let path = entry.path();
            if path
                .file_name()
                .map_or(false, |n| is_tile_file(n.to_string_lossy().as_ref()))
            {
                cfgs.push(Self::from_file(path)?);
            }
        }

        Ok(cfgs)
    }
}
