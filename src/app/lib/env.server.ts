import { type } from "arktype";

const Env = type({
  SPOTIFY_CLIENT_ID: "string",
  SPOTIFY_CLIENT_SECRET: "string",
  SPOTIFY_REDIRECT_URL: "string.url",
  SPOTIFY_AUTHORIZATION_ENDPOINT: "string.url",
  SPOTIFY_TOKEN_ENDPOINT: "string.url",
  SESSION_COOKIE_SECRET: "string",
  DATABASE_URL: "string",
  NODE_ENV: "('development' | 'test' | 'production')='development'",
});

type Env = typeof Env.infer;

function get<K extends keyof Env>(key: K): Env[K] {
  return Env.assert(process.env)[key];
}

export const env = {
  get,
};
