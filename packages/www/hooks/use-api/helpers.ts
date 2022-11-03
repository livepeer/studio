import qs from "qs";

const linkRE = new RegExp("<.[^?]?([^>]*)>");

export const getCursor = (link?: string): string => {
  if (!link) {
    return "";
  }
  const match = link.match(linkRE);
  if (!match) {
    return "";
  }
  const { cursor } = qs.parse(match[1]);
  return cursor?.toString() ?? "";
};
