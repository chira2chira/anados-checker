export function getImageUrl(path: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const sanitizedPath = path.startsWith("/") ? path.slice(1) : path;
  return isProd
    ? `https://anados-collection-tracker.b-cdn.net/static/image/${sanitizedPath}`
    : `/static/image/${sanitizedPath}`;
}
