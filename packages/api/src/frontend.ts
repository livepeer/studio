import express, { Request, Response } from "express";
import frontend from "./frontend-stub";
import mime from "mime";

// middleware that serves a Next.js static frontend which has been
// bundled into the frontend object here

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
  // / --> /index.html
  if (inputPath === "") {
    return "index.html";
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
    }
    console.log(`found page for ${path}`);
    const page = frontend[foundPath];
    const contentType = mime.getType(foundPath);
    res.header("content-type", contentType);
    res.send(Buffer.from(page));
  };
}
