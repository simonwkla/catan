import { parse as dparse, stringify as dstringify } from "devalue";
import { Err, ErrResult, Ok, OkResult, Result } from "./result";

export function deserializeResults(data: unknown): unknown {
  if (data === null || typeof data !== "object") {
    return data;
  }

  if (Result.isResult(data)) {
    const ok = data.ok;
    const value = deserializeResults(ok ? data.val : data.err);
    return ok ? Ok(value) : Err(value);
  }

  if (Array.isArray(data)) {
    const len = data.length;
    for (let i = 0; i < len; i++) {
      data[i] = deserializeResults(data[i]);
    }
    return data;
  }

  const result: Record<string, unknown> = {};
  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      result[key] = deserializeResults(data[key as keyof typeof data]);
    }
  }

  return result;
}

export const stringify: typeof dstringify = (value, reducers) => {
  return dstringify(value, {
    ...reducers,
    Result: (result) =>
      (result instanceof OkResult || result instanceof ErrResult) && [result.ok, result.ok ? result.val : result.err],
  });
};

export const parse: typeof dparse = (serialized, revivers) => {
  return dparse(serialized, {
    ...revivers,
    Result: ([ok, val]) => (ok ? Ok(val) : Err(val)),
  });
};
