use ariadne::{Label, Report, ReportKind, Source};
use chumsky::error::Rich;
use chumsky::prelude::*;
use color_eyre::eyre::{Result, eyre};

use super::{Border, Canvas, Config, ConfigParser, Element, Ground, Layer, RenderMask};

pub struct TxtConfig;

impl ConfigParser for TxtConfig {
    fn from_str(source_id: &str, tile_type: &str, input: &str) -> Result<Config> {
        match cfg_parser(source_id, tile_type).parse(input).into_result() {
            Ok(cfg) => Ok(cfg),
            Err(errs) => Err(eyre!(render_chumsky_errors(source_id, input, errs))),
        }
    }
}

fn render_chumsky_errors(source_id: &str, input: &str, errs: Vec<Rich<char>>) -> String {
    let mut out = String::new();
    let mut buf = Vec::new();
    let source = (source_id, Source::from(input));

    let mut errs = errs;
    errs.sort_by_key(|err| err.span().start());

    for err in errs {
        let span = err.span();
        let start = span.start;
        let mut end = span.end;

        if end == start {
            end = (start + 1).min(input.len());
        }

        let msg = err.to_string();

        let report = Report::build(ReportKind::Error, (source_id, start..end).clone())
            .with_message("parse error")
            .with_label(
                Label::new((source_id, start..end))
                    .with_message(msg)
                    .with_color(ariadne::Color::Red),
            )
            .finish();

        buf.clear();
        let _ = report.write(source.clone(), &mut buf);
        out.push_str(std::str::from_utf8(&buf).unwrap_or(""));
        out.push_str("\n");
    }

    out
}

fn cfg_parser<'a>(
    file_name: &str,
    tile_type: &str,
) -> impl Parser<'a, &'a str, Config, extra::Err<Rich<'a, char>>> {
    let uint = text::int(10).from_str().unwrapped().map(|x: u32| x);

    let int = just("-").padded().or_not().then(uint).map(|(minus, x)| {
        if minus.is_some() {
            (x as i32) * -1
        } else {
            x as i32
        }
    });

    let boolean = choice((just("true"), just("false"))).map(|x| x == "true");

    let int_tuple = int
        .clone()
        .then_ignore(just(",").padded())
        .then(int)
        .delimited_by(just('('), just(')'))
        .map(|(x, y)| (x, y));

    let uint_tuple = uint
        .clone()
        .then_ignore(just(",").padded())
        .then(uint)
        .delimited_by(just('('), just(')'))
        .map(|(x, y)| (x, y));

    let string = just('"')
        .ignore_then(none_of('"').repeated().collect::<String>())
        .then_ignore(just('"'));

    let version = uint.clone().then_ignore(just(".")).then(uint);

    let newline = one_of("\n\r").repeated().at_least(1).ignored();

    let canvas_header = just("#")
        .padded()
        .then(just("CANVAS"))
        .then(newline)
        .ignored();
    let ground_header = just("#")
        .padded()
        .then(just("GROUND"))
        .then(newline)
        .ignored();
    let border_header = just("#")
        .padded()
        .then(just("BORDER"))
        .then(newline)
        .ignored();
    let render_mask_header = just("#")
        .padded()
        .then(just("RENDER MASK"))
        .then(newline)
        .ignored();
    let elements_header = just("#")
        .padded()
        .then(just("ELEMENTS"))
        .then(newline)
        .ignored();

    let version_line = just("version:")
        .padded()
        .then(version)
        .then(newline)
        .ignored();

    let size_line = just("size:")
        .padded()
        .ignore_then(uint_tuple)
        .then_ignore(newline);

    let canvas = canvas_header
        .ignore_then(version_line)
        .ignore_then(size_line)
        .map(|(width, height)| Canvas {
            width,
            height,
        });

    let id = just("id:").padded().ignore_then(string);
    let id_line = id.then_ignore(newline);

    let position = just("position:").padded().ignore_then(int_tuple);
    let position_line = position.then_ignore(newline);

    let render_line = just("render:")
        .padded()
        .ignore_then(boolean)
        .then_ignore(newline);

    let ground = ground_header
        .ignore_then(id_line)
        .then(position_line)
        .then(render_line)
        .map(|((id, position), render)| Ground {
            id,
            position,
            render,
        });

    let border = border_header
        .ignore_then(id_line)
        .then(position_line)
        .map(|(id, position)| Border { id, position });

    let active_line = just("active:")
        .padded()
        .ignore_then(boolean)
        .then_ignore(newline);

    let render_mask = render_mask_header
        .ignore_then(active_line)
        .map(|active| RenderMask { active });

    let layer = just("layer:")
        .padded()
        .ignore_then(choice((just("ground"), just("main"), just("air"))))
        .map(|x| match x {
            "ground" => Layer::Ground,
            "main" => Layer::Main,
            "air" => Layer::Air,
            _ => unreachable!(),
        });

    let flipped = just("flipped:").padded().ignore_then(boolean);

    let sort = just("sort:").padded().ignore_then(uint);

    let element_line = just("element:")
        .padded()
        .ignore_then(id)
        .then(layer)
        .then(position)
        .then(flipped)
        .then(sort)
        .then_ignore(newline)
        .map(|((((id, layer), position), flipped), sort)| Element {
            id,
            layer,
            position,
            flipped,
            sort,
        });

    let elements = elements_header.ignore_then(element_line.repeated().collect::<Vec<_>>());

    canvas
        .then(ground.or_not())
        .then(border.or_not())
        .then(render_mask.or_not())
        .then(elements)
        .then_ignore(end())
        .map(
            |((((canvas, ground), border), render_mask), elements)| Config {
                canvas,
                render_mask,
                ground,
                border,
                elements,
                source_id: file_name.to_string(),
                tile_type: tile_type.to_string(),
            },
        )
}
