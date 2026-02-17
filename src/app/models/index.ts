export type User = {
  id: string;
  name: string;
  session: UserSession;
};

export type UserSession = {
  accessToken: string;
  tokenType: string;
  refreshToken: string;
  expiresInSeconds: number;
};
export type Image = {
  url: string;
  width: number;
  height: number;
};

export type Artist = {
  id: string;
  name: string;
};

export type Track = {
  id: string;
  name: string;
  durationMs: number;
  artists: readonly Artist[];
  images: readonly Image[];
  tempoBpm: number;
};

export type Playlist = {
  id: string;
  userId: string;
  name: string;
  snapshotId: string;
  images: readonly Image[];
  tracks: readonly Track[];
};

export type PlaylistSnapshot = {
  id: string;
  snapshotId: string;
};

export type PlaylistSyncEvent =
  | {
      kind: "start-sync";
      numberOfPlaylists: number;
    }
  | {
      kind: "playlist-sync";
      playlistId: string;
      playlistName: string;
    }
  | {
      kind: "finish-playlist-sync";
      playlistId: string;
      playlistName: string;
    }
  | {
      kind: "fetch-track";
      trackId: string;
      trackName: string;
    }
  | {
      kind: "fetch-track-audio-features";
      trackId: string;
    }
  | {
      kind: "finish-sync";
      playlists: readonly Playlist[];
    };
