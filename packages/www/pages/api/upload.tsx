import { IncomingForm } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import sanityClient from "@sanity/client";
import { createReadStream } from "fs";

const client = sanityClient({
  projectId: "dp4k3mpw",
  dataset: "production",
  token: process.env.SANITY_API_TOKEN,
  useCdn: true,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const data: any = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  const newLocal = createReadStream(data.files.file.path);

  if (newLocal)
    client.assets
      .upload("file", newLocal, {
        filename: data.files.file.name,
      })
      .then((fileAsset) => {
        res.status(200).json(fileAsset);
      })
      .catch((e) => res.status(400).json({ errors: e }));
};
