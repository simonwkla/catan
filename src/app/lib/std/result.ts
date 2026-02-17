import type { AnyAsyncFn, AnyFn } from "../std/types";

export type Result<T, E> = OkResult<T> | ErrResult<E>;

type ErrMapFn<E> = (e: unknown) => E;

const __result_kind = "__result" as const;

abstract class BaseResult {
  readonly __kind = __result_kind;
}

export class OkResult<T> extends BaseResult {
  readonly ok = true;
  readonly val: T;

  private constructor(value: T) {
    super();
    this.val = value;
  }

  static ok<T>(value: T): OkResult<T> {
    return new OkResult(value);
  }

  isOk(): this is this & OkResult<T> {
    return true;
  }

  isErr(): this is this & ErrResult<T> {
    return false;
  }

  unwrap(): T {
    return this.val;
  }

  unpack(): [T, null] {
    return [this.val, null];
  }

  map<U>(fn: (value: T) => U): OkResult<U> {
    return Ok(fn(this.val));
  }

  mapErr(): OkResult<T> {
    return this;
  }
}

export class ErrResult<E> extends BaseResult {
  readonly ok = false;
  readonly err: E;

  private constructor(error: E) {
    super();
    this.err = error;
  }

  static err<E>(error: E): ErrResult<E> {
    return new ErrResult(error);
  }

  isOk(): this is this & OkResult<never> {
    return false;
  }

  isErr(): this is this & ErrResult<E> {
    return true;
  }

  unwrap(): never {
    throw new Error("Result is an error");
  }

  unpack(): [null, E] {
    return [null, this.err];
  }

  map(): ErrResult<E> {
    return this;
  }

  mapErr<F>(fn: (error: E) => F): ErrResult<F> {
    return Err(fn(this.err));
  }
}

const tryFn = <T, E>(fn: () => T, err: ErrMapFn<E>): Result<T, E> => {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(err(error));
  }
};

const tryAsync = async <T, E>(fn: () => Promise<T>, err: ErrMapFn<E>): Promise<Result<T, E>> => {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(err(error));
  }
};

const wrap = <E, Fn extends AnyFn>(
  fn: Fn,
  err: ErrMapFn<E>,
): ((...args: Parameters<Fn>) => OkResult<ReturnType<Fn>> | ErrResult<E>) => {
  return (...args: Parameters<Fn>) => {
    return tryFn(() => fn(...args), err);
  };
};

const wrapAsync = <E, Fn extends AnyAsyncFn>(
  fn: Fn,
  err: ErrMapFn<E>,
): ((...args: Parameters<Fn>) => Promise<Result<Awaited<ReturnType<Fn>>, E>>) => {
  return (...args: Parameters<Fn>) => {
    return tryAsync(() => fn(...args), err);
  };
};

export const isResult = (value: unknown): value is Result<unknown, unknown> => {
  return typeof value === "object" && value !== null && "__kind" in value && value.__kind === __result_kind;
};

export const Ok = OkResult.ok;
export const Err = ErrResult.err;
export const Result = {
  isResult: isResult,
  try: tryFn,
  tryAsync: tryAsync,
  wrap: wrap,
  wrapAsync: wrapAsync,
};
