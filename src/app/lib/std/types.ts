export type Pretty<T> = {
  [K in keyof T]: T[K];
};

export type ClassProps<C> = {
  // biome-ignore lint/complexity/noBannedTypes: correct here
  [Key in keyof C as C[Key] extends Function ? never : Key]: C[Key];
};

export type AnyFn<R = any> = (...args: any[]) => R;

export type AnyAsyncFn<R = any> = (...args: any[]) => Promise<R>;
