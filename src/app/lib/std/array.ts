function uniqueByProperty<K extends PropertyKey, T extends { [key in K]: string }>(array: T[], property: K): T[] {
  const map = new Map<string, T>();
  for (const item of array) {
    map.set(item[property], item);
  }
  return Array.from(map.values());
}

export const array = {
  uniqueByProperty: uniqueByProperty,
};
