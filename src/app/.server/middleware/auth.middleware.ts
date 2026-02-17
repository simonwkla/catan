import { type } from "arktype";
import {
  createContext,
  createCookie,
  href,
  type MiddlewareFunction,
  type RouterContextProvider,
  redirect,
} from "react-router";
import { match, P } from "ts-pattern";
import { env } from "@/lib/env.server";
import { http } from "@/lib/std/http";
import type { User } from "@/models";

const SESSION_COOKIE_NAME = "bpm-session";

const sessionCookie = createCookie(SESSION_COOKIE_NAME, {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
  secrets: [env.get("SESSION_COOKIE_SECRET")],
});

const serializedUser = type({
  id: "string",
  name: "string",
  session: {
    accessToken: "string",
    tokenType: "string",
    refreshToken: "string",
    expiresInSeconds: "number",
  },
});

export type SerializedUser = typeof serializedUser.infer;

async function parseSession(request: Request): Promise<User | null> {
  const cookie = request.headers.get("Cookie") ?? "";
  const rawSession = await sessionCookie.parse(cookie);
  const user = serializedUser(rawSession);
  if (user instanceof type.errors) {
    //throw new Error(user.toLocaleString());
    return null;
  }
  return user;
}

async function serializeSession(user: User): Promise<string> {
  const serialized = serializedUser.from(user);
  return sessionCookie.serialize(serialized);
}

async function deleteSession(_request: Request): Promise<string> {
  return await sessionCookie.serialize(null, {
    maxAge: 0,
  });
}

const userContext = createContext<User | null>(null);

export const authMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
  context.set(userContext, null);

  const prevUser = await parseSession(request);
  context.set(userContext, prevUser);

  const response = (await next()) as Response;

  // reget user from context
  const user = context.get(userContext);

  return match({ prevUser, user })
    .with({ prevUser: null, user: null }, async () => response)
    .with({ prevUser: P.nonNullable, user: P.nonNullable }, async () => response)
    .with({ prevUser: P.nonNullable, user: null }, async () => {
      return http.setResponseCookie(response, await deleteSession(request));
    })
    .with({ prevUser: null, user: P.nonNullable }, async ({ user }) => {
      return http.setResponseCookie(response, await serializeSession(user));
    })
    .exhaustive();
};

const requireUser: (context: Readonly<RouterContextProvider>) => User = (context) => {
  const user = auth.getUser(context);
  if (!user) {
    throw redirect(href("/spotify/login"));
  }
  return user;
};

const requireNoUser: (context: Readonly<RouterContextProvider>) => void = (context) => {
  const user = auth.getUser(context);
  if (user) {
    throw redirect(href("/"));
  }
};

export const auth = {
  getUser: (context: Readonly<RouterContextProvider>) => context.get(userContext),
  setUser: (context: Readonly<RouterContextProvider>, user: User) => context.set(userContext, user),
  deleteUser: (context: Readonly<RouterContextProvider>) => context.set(userContext, null),
  requireUser: requireUser,
  requireNoUser: requireNoUser,
};
