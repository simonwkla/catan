export type Exception = {
  readonly kind: string;
  readonly message: string;
};

export type SpotifyApiException = Exception & {
  readonly kind: "spotify-api-exception";
  readonly cause: {
    readonly name: string;
    readonly message: string;
    readonly stack: string | null;
  } | null;
};
