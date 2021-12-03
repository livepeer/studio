const projectUrl =
  process.env.NODE_ENV === "production"
    ? "https://livepeer.com"
    : "https://livepeer.monster/api";

export default function resolveProductionUrl(document) {
  if (document._type === "post") {
    return `${projectUrl}/preview/blog/${document.slug.current}`;
  }
  if (document._type === "job") {
    return `${projectUrl}/preview/jobs/${document.slug.current}`;
  }
  if (document._type === "page") {
    return `${projectUrl}/preview/${document.slug.current}`;
  }
  return `${projectUrl}`;
}
