type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

type ObjectFromEntries<T extends ReadonlyArray<readonly [PropertyKey, unknown]>> = {
  [K in T[number] as K[0]]: K[1];
};

function getEntries<T extends object>(obj: T): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}

function fromEntries<const T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(entries: T): ObjectFromEntries<T> {
  return Object.fromEntries(entries) as ObjectFromEntries<T>;
}

export const obj = {
  getEntries: getEntries,
  fromEntries: fromEntries,
};
