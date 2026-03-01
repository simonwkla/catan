import { useActionData as useActionDataReactRouter, useLoaderData as useLoaderDataReactRouter } from "react-router";
import { Err, Ok, Result } from "@/lib/std";

// recursively walk through the data and transform any Result objects into result class
const deserialize = (data: unknown): unknown => {
  // fast path for anything that is not an object (arrays are objects too)
  if (data === null || typeof data !== "object") {
    return data;
  }

  if (Result.isResult(data)) {
    const ok = data.ok;
    const val = deserialize(ok ? data.val : data.err);
    return ok ? Ok(val) : Err(val);
  }

  if (Array.isArray(data)) {
    const len = data.length;
    for (let i = 0; i < len; i++) {
      data[i] = deserialize(data[i]);
    }
    return data;
  }

  const result: Record<string, unknown> = {};
  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      result[key] = deserialize(data[key as keyof typeof data]);
    }
  }

  return result;
};

export function useLoaderData<T>() {
  const data = useLoaderDataReactRouter<T>();
  return deserialize(data) as typeof data;
}

export function useActionData<T>() {
  const data = useActionDataReactRouter<T>();
  return deserialize(data) as typeof data;
}
