import type { ClassProps } from "@/lib/std/types";

type ImageProps = ClassProps<Image>;
export class Image {
  private constructor(
    public readonly url: string,
    public readonly width: number,
    public readonly height: number,
  ) {}

  static create(props: ImageProps): Image {
    return new Image(props.url, props.width, props.height);
  }
}
