import express, { Request, Response } from "express";
import frontend from "../../www/static-build";
import mime from "mime";

const resolveFile = (inputPath: string): string | null => {
  // Exact match, easy!
  if (frontend[inputPath]) {
    return inputPath;
  }
  // /dashboard --> dashboard.html
  const htmlPath = `${inputPath}.html`;
  if (frontend[htmlPath]) {
    return htmlPath;
  }
  // /dashboard/stream/abc123 --> /dashboard/stream/[id].html
  const parts = inputPath.split("/").slice(0, -1);
  const slugPath = `${parts.join("/")}/[id].html`;
  console.log(`SLUG PATH: ${slugPath}`);
  if (frontend[slugPath]) {
    return slugPath;
  }
  return null;
};

// Stub thing to call when we don't want the whole frontend there
export default function () {
  return (req: Request, res: Response, next) => {
    const path = decodeURIComponent(req.path.slice(1));
    const foundPath = resolveFile(path);
    if (!foundPath) {
      console.log(`no match for ${path}`);
      return next();
    } else {
      console.log(`found page for ${path}`);
    }
    const page = frontend[foundPath];
    const contentType = mime.getType(foundPath);
    res.header("content-type", contentType);
    res.send(Buffer.from(page));
  };
}
