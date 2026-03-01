import { type AccessToken, type IValidateResponses, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { type } from "arktype";
import { match, P } from "ts-pattern";
import { type ClassProps, Err, Ok, Result } from "../std";
import { Exception } from "../std/err";

export type SpotifyApiException =
  | SpotifyOtherException
  | SpotifyRateLimitException
  | SpotifyUnauthorizedException
  | SpotifyBadRequestException;

class SpotifyOtherException extends Exception {
  readonly kind = "spotify-other-exception" as const;
}

class SpotifyBadRequestException extends Exception {
  readonly kind = "spotify-bad-request-exception" as const;
}

class SpotifyRateLimitException extends Exception {
  readonly kind = "spotify-rate-limit-exception" as const;

  constructor() {
    super("Spotify API rate limit exceeded");
  }
}

class SpotifyUnauthorizedException extends Exception {
  readonly kind = "spotify-unauthorized-exception" as const;

  constructor() {
    super("Spotify API unauthorized");
  }
}

class InternalSpotifyError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }

  toSpotifyException(): SpotifyApiException {
    return match(this.status)
      .with(401, () => new SpotifyUnauthorizedException())
      .with(403, () => new SpotifyRateLimitException())
      .with(429, () => new SpotifyRateLimitException())
      .otherwise(() => new SpotifyOtherException(this.message));
  }
}

export const SpotifyTokenResponse = type({
  access_token: "string",
  token_type: "string",
  expires_in: "number.integer > 0",
  refresh_token: "string",
});

export type SpotifyTokenResponse = typeof SpotifyTokenResponse.infer;

const handleError = (error: unknown): SpotifyApiException => {
  return match(error)
    .with(P.instanceOf(InternalSpotifyError), (error) => {
      return error.toSpotifyException();
    })
    .with(P.instanceOf(Error), (error) => new SpotifyOtherException(error.message))
    .with(P.string, (message) => new SpotifyOtherException(message))
    .otherwise(() => new SpotifyOtherException("Unknown error"));
};

export type SpotifyAuthProps = ClassProps<SpotifyAuthSdk>;

export class SpotifyAuthSdk {
  private constructor(
    readonly CLIENT_ID: string,
    readonly CLIENT_SECRET: string,
    readonly AUTHORIZATION_ENDPOINT: string,
    readonly REDIRECT_URL: string,
    readonly TOKEN_ENDPOINT: string,
  ) {}

  static create(props: SpotifyAuthProps): SpotifyAuthSdk {
    return new SpotifyAuthSdk(
      props.CLIENT_ID,
      props.CLIENT_SECRET,
      props.AUTHORIZATION_ENDPOINT,
      props.REDIRECT_URL,
      props.TOKEN_ENDPOINT,
    );
  }

  async resolveTokensFromCode(code: string): Promise<Result<SpotifyTokenResponse, SpotifyApiException>> {
    const [res, err] = (
      await Result.tryAsync(
        async () =>
          fetch(this.TOKEN_ENDPOINT, {
            method: "POST",
            body: `code=${code}&redirect_uri=${this.REDIRECT_URL}&grant_type=authorization_code`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString("base64")}`,
            },
          }),
        handleError,
      )
    ).unpack();

    if (err) {
      return Err(err);
    }

    const token = SpotifyTokenResponse(await res.json());
    if (token instanceof type.errors) {
      return Err(new SpotifyBadRequestException(token.toLocaleString()));
    }

    return Ok(token);
  }

  getAuthenticationUrl(scopes: string[]): string {
    const searchParams = new URLSearchParams();
    searchParams.set("response_type", "code");
    searchParams.set("client_id", this.CLIENT_ID);
    searchParams.set("redirect_uri", this.REDIRECT_URL);
    searchParams.set("show_dialog", "true");
    for (const s of scopes) {
      searchParams.append("scope", s);
    }
    return `${this.AUTHORIZATION_ENDPOINT}?${searchParams.toString()}`;
  }
}

export class SpotifySdk {
  private readonly sdk: SpotifyApi;

  private constructor(sdk: SpotifyApi) {
    this.sdk = sdk;
  }

  static withAccessToken(clientId: string, accessToken: AccessToken): SpotifySdk {
    return new SpotifySdk(
      SpotifyApi.withAccessToken(clientId, accessToken, {
        responseValidator: new (class implements IValidateResponses {
          async validateResponse(response: Response): Promise<void> {
            if (response.status !== 200) {
              const body = (await response.json()) as { error: { status: number; message?: string } };

              throw new InternalSpotifyError(
                body.error.message ?? `Spotify API returned error code ${response.status}`,
                response.status,
              );
            }
          }
        })(),
      }),
    );
  }

  static async tryAsync<T>(fn: () => Promise<T>, retry = 1): Promise<Result<T, SpotifyApiException>> {
    const result = await Result.tryAsync(fn, handleError);

    // always wait 0.5 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (result.isErr() && result.err.kind === "spotify-rate-limit-exception" && retry > 0) {
      // wait for 30 seconds, then retry
      await new Promise((resolve) => setTimeout(resolve, 30000));
      return SpotifySdk.tryAsync(fn, retry - 1);
    }

    return result;
  }

  getPlaylistItems(
    playlistId: Parameters<SpotifyApi["playlists"]["getPlaylistItems"]>[0],
    limit: Parameters<SpotifyApi["playlists"]["getPlaylistItems"]>[3],
    offset: Parameters<SpotifyApi["playlists"]["getPlaylistItems"]>[4],
  ) {
    return SpotifySdk.tryAsync(
      async () => await this.sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset, undefined),
    );
  }

  getTrackAudioFeatures(trackId: string) {
    return SpotifySdk.tryAsync(async () => await this.sdk.tracks.audioFeatures(trackId));
  }

  getAudioFeatures(...args: Parameters<SpotifyApi["tracks"]["audioFeatures"]>) {
    return SpotifySdk.tryAsync(async () => await this.sdk.tracks.audioFeatures(...args));
  }

  getUserSimplePlaylists(...args: Parameters<SpotifyApi["currentUser"]["playlists"]["playlists"]>) {
    return SpotifySdk.tryAsync(async () => await this.sdk.currentUser.playlists.playlists(...args));
  }

  getCurrentUserProfile(...args: Parameters<SpotifyApi["currentUser"]["profile"]>) {
    return SpotifySdk.tryAsync(async () => await this.sdk.currentUser.profile(...args));
  }
}
