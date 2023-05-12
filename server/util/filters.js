
export function createNameFilter(name) {
  return `FILTER CONTAINS(UPPER(doc.name), @nameFilter)`
}