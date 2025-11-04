export function sorter<T>(
  a: T,
  b: T,
  sortby: keyof T,
  order: "asc" | "desc" = "asc"
): number {
  const aVal = a[sortby];
  const bVal = b[sortby];
  const multiplier = order === "asc" ? 1 : -1;

  if (typeof aVal === "string" && typeof bVal === "string") {
    const aDate = new Date(aVal);
    const bDate = new Date(bVal);
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return (aDate.getTime() - bDate.getTime()) * multiplier;
    }
    return aVal.toLowerCase().localeCompare(bVal.toLowerCase()) * multiplier;
  }

  if (typeof aVal === "number" && typeof bVal === "number") {
    return (aVal - bVal) * multiplier;
  }

  return 0;
}
