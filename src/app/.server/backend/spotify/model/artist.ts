import { type ClassProps, type OpaqueOf, opaque } from "@/lib/std";

export const ArtistId = opaque<string, "artistId">();
export type ArtistId = OpaqueOf<typeof ArtistId>;

export const ArtistName = opaque<string, "artistName">();
export type ArtistName = OpaqueOf<typeof ArtistName>;

type ArtistProps = ClassProps<Artist>;
export class Artist {
  private constructor(
    public readonly id: ArtistId,
    public readonly name: ArtistName,
  ) {}

  static from(props: ArtistProps): Artist {
    return new Artist(props.id, props.name);
  }
}
