import { Duration } from "luxon";
import { match } from "ts-pattern";
import type { Artist as DomainArtist } from "@/.server/backend/spotify/model/artist";
import type { PlaylistSyncEvent as DomainPlaylistSyncEvent } from "@/.server/backend/spotify/model/event";
import type { Image as DomainImage } from "@/.server/backend/spotify/model/image";
import type { Playlist as DomainPlaylist } from "@/.server/backend/spotify/model/playlist";
import type { Track as DomainTrack } from "@/.server/backend/spotify/model/track";
import { type User as DomainUser, UserId, UserSession } from "@/.server/backend/spotify/model/user";
import type { SpotifyApiException as DomainSpotifyApiException } from "@/lib/spotify";
import { fn, type Result } from "@/lib/std";
import type { Artist, Image, Playlist, PlaylistSyncEvent, Track, User } from "@/models";
import type { SpotifyApiException } from "@/models/err";
import { spotifyApplication } from "../backend/cmd";

export const spotifyBff = {
  async getAuthenticationUrl(): Promise<string> {
    return spotifyApplication.getAuthenticationUrl();
  },

  async resolveUserFromCode(code: string): Promise<Result<User, SpotifyApiException>> {
    return (await spotifyApplication.resolveUserFromCode(code))
      .map(FromDomain.user)
      .mapErr(FromDomain.spotifyApiException);
  },

  async *syncPlaylists(user: User): AsyncGenerator<Result<PlaylistSyncEvent, SpotifyApiException>, void, unknown> {
    const generator = spotifyApplication.syncPlaylists(FromBff.user(user));
    for await (const event of generator) {
      yield event.map(FromDomain.syncEvent).mapErr(FromDomain.spotifyApiException);
    }
  },
};

const FromDomain = {
  user: (domain: DomainUser): User => ({
    id: domain.id,
    name: domain.name,
    session: {
      accessToken: domain.session.accessToken,
      tokenType: domain.session.tokenType,
      refreshToken: domain.session.refreshToken,
      expiresInSeconds: domain.session.expiresIn.seconds,
    },
  }),
  syncEvent: (event: DomainPlaylistSyncEvent): PlaylistSyncEvent => {
    return match(event)
      .with({ kind: "start-sync" }, (event) => ({
        kind: "start-sync" as const,
        numberOfPlaylists: event.numberOfPlaylists,
      }))
      .with({ kind: "playlist-sync" }, (event) => ({
        kind: "playlist-sync" as const,
        playlistId: event.playlistId,
        playlistName: event.playlistName,
      }))
      .with({ kind: "finish-playlist-sync" }, (event) => ({
        kind: "finish-playlist-sync" as const,
        playlistId: event.playlistId,
        playlistName: event.playlistName,
      }))
      .with({ kind: "fetch-track" }, (event) => ({
        kind: "fetch-track" as const,
        trackId: event.trackId,
        trackName: event.trackName,
      }))
      .with({ kind: "fetch-track-audio-features" }, (event) => ({
        kind: "fetch-track-audio-features" as const,
        trackId: event.trackId,
      }))
      .with({ kind: "finish-sync" }, (event) => ({
        kind: "finish-sync" as const,
        playlists: event.playlists.map(FromDomain.playlist),
      }))
      .exhaustive();
  },
  playlist: (domain: DomainPlaylist): Playlist => ({
    id: domain.id,
    userId: domain.userId,
    name: domain.name,
    snapshotId: domain.snapshotId,
    images: domain.images.map(FromDomain.image),
    tracks: domain.tracks.map(FromDomain.track),
  }),
  track: (domain: DomainTrack): Track => ({
    id: domain.id,
    name: domain.name,
    durationMs: domain.duration.toMillis(),
    artists: domain.artists.map(FromDomain.artist),
    images: domain.images.map(FromDomain.image),
    tempoBpm: domain.tempoBpm,
  }),
  artist: (domain: DomainArtist): Artist => ({
    id: domain.id,
    name: domain.name,
  }),
  image: (domain: DomainImage): Image => ({
    url: domain.url,
    width: domain.width,
    height: domain.height,
  }),
  spotifyApiException: (domain: DomainSpotifyApiException): SpotifyApiException => ({
    kind: domain.kind,
    message: domain.message,
    cause: fn.applyOptional(domain.cause, (cause) => ({
      name: cause.name,
      message: cause.message,
      stack: cause.stack ?? null,
    })),
  }),
};

const FromBff = {
  user: (bff: User): DomainUser => ({
    id: UserId.from(bff.id),
    name: bff.name,
    session: UserSession.create({
      accessToken: bff.session.accessToken,
      tokenType: bff.session.tokenType,
      refreshToken: bff.session.refreshToken,
      expiresIn: Duration.fromObject({ seconds: bff.session.expiresInSeconds }),
    }),
  }),
};
