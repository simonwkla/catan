import type { Duration } from "luxon";
import { type ClassProps, type OpaqueOf, opaque } from "@/lib/std";

export const UserId = opaque<string, "userId">();
export type UserId = OpaqueOf<typeof UserId>;

export class User {
  private constructor(
    public readonly id: UserId,
    public readonly name: string,
    public readonly session: UserSession,
  ) {}

  static from(props: ClassProps<User>): User {
    return new User(props.id, props.name, props.session);
  }
}

type UserSessionProps = ClassProps<UserSession>;
export class UserSession {
  private constructor(
    public readonly accessToken: string,
    public readonly tokenType: string,
    public readonly refreshToken: string,
    public readonly expiresIn: Duration,
  ) {}

  static create(props: UserSessionProps): UserSession {
    return new UserSession(props.accessToken, props.tokenType, props.refreshToken, props.expiresIn);
  }
}
