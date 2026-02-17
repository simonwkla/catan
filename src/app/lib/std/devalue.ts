import { parse as dparse, stringify as dstringify } from "devalue";
import { Err, ErrResult, Ok, OkResult } from "./result";

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
