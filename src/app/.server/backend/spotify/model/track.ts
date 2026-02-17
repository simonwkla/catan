import type { Duration } from "luxon";
import { type ClassProps, type OpaqueOf, opaque } from "@/lib/std";
import type { Artist } from "./artist";
import type { Image } from "./image";

export const TrackId = opaque<string, "trackId">();
export type TrackId = OpaqueOf<typeof TrackId>;

export const TrackName = opaque<string, "trackName">();
export type TrackName = OpaqueOf<typeof TrackName>;

type TrackProps = ClassProps<Track>;
export class Track {
  private constructor(
    public readonly id: TrackId,
    public readonly name: TrackName,
    public readonly duration: Duration,
    public readonly artists: readonly Artist[],
    public readonly images: readonly Image[],
    public readonly tempoBpm: number,
  ) {}

  static from(props: TrackProps): Track {
    return new Track(props.id, props.name, props.duration, props.artists, props.images, props.tempoBpm);
  }
}
