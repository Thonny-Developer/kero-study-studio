export function initials(name: string) {
  return name
    .split(/[ ._-]/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
