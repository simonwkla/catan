import { eventStream } from "remix-utils/sse/server";
import { spotifyBff } from "@/.server/bff/spotify";
import { auth } from "@/.server/middleware/auth.middleware";
import type { SpotifyApiException } from "@/lib/spotify";
import type { Result } from "@/lib/std";
import { stringify } from "@/lib/std";
import type { PlaylistSyncEvent } from "@/models";
import type { Route } from "../+types";

export type SSEEvent = Result<PlaylistSyncEvent, SpotifyApiException>;

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const user = auth.requireUser(context);

  const controller = new AbortController();

  request.signal.addEventListener("abort", () => {
    controller.abort();
  });

  return eventStream(controller.signal, function setup(send) {
    async function subscribe() {
      const generator = spotifyBff.syncPlaylists(user);

      for await (const event of generator) {
        send({ data: stringify(event), event: "sync-event" });
      }
    }

    subscribe();

    return () => {
      controller.abort();
    };
  });
};
