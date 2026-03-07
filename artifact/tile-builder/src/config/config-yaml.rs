use serde::Deserialize;

use super::{Border, Canvas, Config, ConfigParser, Element, Ground, Layer, RenderMask};

#[derive(Debug, Deserialize)]
struct YamlDoc {
    canvas: YamlCanvas,
    #[serde(default)]
    ground: Option<YamlGround>,
    #[serde(default)]
    border: Option<YamlBorder>,
    #[serde(default)]
    cfg: Option<YamlCfg>,
    #[serde(default)]
    elements: Vec<YamlElement>,
}

#[derive(Debug, Deserialize)]
struct YamlCanvas {
    size: [u32; 2],
}

#[derive(Debug, Deserialize)]
struct YamlGround {
    id: String,
    position: [i32; 2],
    #[serde(default = "default_true")]
    render: bool,
}

#[derive(Debug, Deserialize)]
struct YamlBorder {
    id: String,
    position: [i32; 2],
}

#[derive(Debug, Deserialize)]
struct YamlElement {
    id: String,
    layer: YamlLayer,
    position: [i32; 2],
    #[serde(default = "default_false")]
    flipped: bool,
    #[serde(default = "default_sort")]
    sort: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
enum YamlLayer {
    Ground,
    Main,
    Air,
}

#[derive(Debug, Deserialize)]
struct YamlCfg {
    #[serde(default = "default_true")]
    render_mask_active: bool,
}

fn default_true() -> bool {
    true
}

fn default_false() -> bool {
    false
}

fn default_sort() -> u32 {
    0
}

pub struct YamlConfig;

impl ConfigParser for YamlConfig {
    fn from_str(
        source_id: &str,
        tile_type: &str,
        input: &str,
    ) -> color_eyre::eyre::Result<Config> {
        let doc: YamlDoc = serde_yaml::from_str(input)
            .map_err(|e| color_eyre::eyre::eyre!("Failed to parse YAML: {}", e))?;
        Ok(doc.into_config(source_id, tile_type))
    }
}

impl YamlDoc {
    fn into_config(self, source_id: &str, tile_type: &str) -> Config {
        let render_mask = self.cfg.map(|c| RenderMask {
            active: c.render_mask_active,
        });

        let ground = self.ground.map(|g| Ground {
            id: g.id,
            position: (g.position[0], g.position[1]),
            render: g.render,
        });

        let border = self.border.map(|b| Border {
            id: b.id,
            position: (b.position[0], b.position[1]),
        });

        let elements = self
            .elements
            .into_iter()
            .map(|e| Element {
                id: e.id,
                layer: match e.layer {
                    YamlLayer::Ground => Layer::Ground,
                    YamlLayer::Main => Layer::Main,
                    YamlLayer::Air => Layer::Air,
                },
                position: (e.position[0], e.position[1]),
                flipped: e.flipped,
                sort: e.sort,
            })
            .collect();

        Config {
            canvas: Canvas {
                width: self.canvas.size[0],
                height: self.canvas.size[1],
            },
            render_mask,
            ground,
            border,
            elements,
            source_id: source_id.to_string(),
            tile_type: tile_type.to_string(),
        }
    }
}
