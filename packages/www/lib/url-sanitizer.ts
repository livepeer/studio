export function sanitizeUrl(url: string) {
  const urlObject = new URL(url);
  return urlObject.hostname + urlObject.pathname;
}
