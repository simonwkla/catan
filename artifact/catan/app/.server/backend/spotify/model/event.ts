import type { ClassProps } from "@/lib/std";
import type { Playlist, PlaylistId, PlaylistName } from "./playlist";
import type { TrackId, TrackName } from "./track";

export type PlaylistFetchEvent =
  | StartFetchPlaylistEvent
  | FinishFetchPlaylistEvent
  | FetchTrackEvent
  | FetchTrackAudioFeaturesEvent;

export type PlaylistSyncEvent = StartSyncEvent | FinishSyncEvent | PlaylistFetchEvent;

export type StartSyncEventProp = Omit<ClassProps<StartSyncEvent>, "kind">;
export class StartSyncEvent {
  readonly kind = "start-sync" as const;

  private constructor(readonly numberOfPlaylists: number) {}

  static create(props: StartSyncEventProp): StartSyncEvent {
    return new StartSyncEvent(props.numberOfPlaylists);
  }
}

export type FinishSyncEventProp = Omit<ClassProps<FinishSyncEvent>, "kind">;
export class FinishSyncEvent {
  readonly kind = "finish-sync" as const;
  private constructor(readonly playlists: Playlist[]) {}

  static create(props: FinishSyncEventProp): FinishSyncEvent {
    return new FinishSyncEvent(props.playlists);
  }
}

export type StartFetchPlaylistEventProps = Omit<ClassProps<StartFetchPlaylistEvent>, "kind">;
export class StartFetchPlaylistEvent {
  readonly kind = "playlist-sync" as const;
  private constructor(
    readonly playlistId: PlaylistId,
    readonly playlistName: PlaylistName,
  ) {}

  static create(props: StartFetchPlaylistEventProps): StartFetchPlaylistEvent {
    return new StartFetchPlaylistEvent(props.playlistId, props.playlistName);
  }
}

export type FinishFetchPlaylistEventProps = Omit<ClassProps<FinishFetchPlaylistEvent>, "kind">;
export class FinishFetchPlaylistEvent {
  readonly kind = "finish-playlist-sync" as const;

  private constructor(
    readonly playlistId: PlaylistId,
    readonly playlistName: PlaylistName,
  ) {}

  static create(props: FinishFetchPlaylistEventProps): FinishFetchPlaylistEvent {
    return new FinishFetchPlaylistEvent(props.playlistId, props.playlistName);
  }
}

export type FetchTrackEventProps = Omit<ClassProps<FetchTrackEvent>, "kind">;
export class FetchTrackEvent {
  readonly kind = "fetch-track" as const;

  private constructor(
    readonly trackId: TrackId,
    readonly trackName: TrackName,
  ) {}

  static create(props: FetchTrackEventProps): FetchTrackEvent {
    return new FetchTrackEvent(props.trackId, props.trackName);
  }
}

export type FetchTrackAudioFeaturesEventProps = Omit<ClassProps<FetchTrackAudioFeaturesEvent>, "kind">;
export class FetchTrackAudioFeaturesEvent {
  readonly kind = "fetch-track-audio-features" as const;

  private constructor(readonly trackId: TrackId) {}

  static create(props: FetchTrackAudioFeaturesEventProps): FetchTrackAudioFeaturesEvent {
    return new FetchTrackAudioFeaturesEvent(props.trackId);
  }
}
