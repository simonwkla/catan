import { type ClassProps, type OpaqueOf, opaque } from "@/lib/std";
import type { Image } from "./image";
import type { Track } from "./track";
import type { UserId } from "./user";

export const PlaylistId = opaque<string, "playlistId">();
export type PlaylistId = OpaqueOf<typeof PlaylistId>;

export const PlaylistName = opaque<string, "playlistName">();
export type PlaylistName = OpaqueOf<typeof PlaylistName>;

type PlaylistProps = ClassProps<Playlist>;
export class Playlist {
  private constructor(
    public readonly id: PlaylistId,
    public readonly userId: UserId,
    public readonly name: PlaylistName,
    public readonly snapshotId: string,
    public readonly images: readonly Image[],
    public readonly tracks: readonly Track[],
  ) {}

  static from(props: PlaylistProps): Playlist {
    return new Playlist(props.id, props.userId, props.name, props.snapshotId, props.images, props.tracks);
  }
}

type PlaylistSnapshotProps = ClassProps<PlaylistSnapshot>;
export class PlaylistSnapshot {
  private constructor(
    public readonly id: PlaylistId,
    public readonly snapshotId: string,
  ) {}

  static from(props: PlaylistSnapshotProps): PlaylistSnapshot {
    return new PlaylistSnapshot(props.id, props.snapshotId);
  }
}
