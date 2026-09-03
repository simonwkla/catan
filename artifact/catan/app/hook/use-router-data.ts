import { useActionData as useActionDataReactRouter, useLoaderData as useLoaderDataReactRouter } from "react-router";
import { deserializeResults } from "@/lib/std";

export function useLoaderData<T>() {
  const data = useLoaderDataReactRouter<T>();
  return deserializeResults(data) as typeof data;
}

export function useActionData<T>() {
  const data = useActionDataReactRouter<T>();
  return deserializeResults(data) as typeof data;
}
