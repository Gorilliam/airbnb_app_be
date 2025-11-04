export function partialFilter<T>(obj: T, filter: string, keys: (keyof T)[]): boolean {
  return keys.some((key) => {
    const value = obj[key];
    if (typeof value === "string") {
      return value.toLowerCase().includes(filter.toLowerCase());
    }
    return value === filter;
  });
}

export function exactFilter<T>(obj: T, filter: string, keys: (keyof T)[]): boolean {
  return keys.some((key) => {
    const value = obj[key];
    if (typeof value === "string") {
      return value.toLowerCase() === filter.toLowerCase();
    }
    return value === filter;
  });
}
