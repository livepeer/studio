import type { NextApiRequest, NextApiResponse } from "next";
import { getJobById } from "lib/teamtailor";

type ResponseSuccessMessage = "success";
type ResponseFallbackMessage = "this service is unsupported";

interface Job {
  id: string;
  title: string;
  body: string;
  name: string;
  resume: string;
  coverLetter: string;
  phone: string;
}

interface SuccessResponse {
  message: ResponseSuccessMessage;
  data: Job;
}

interface FallbackResponse {
  message: ResponseFallbackMessage;
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | FallbackResponse>
) => {
  try {
    const job = await getJobById(req.query.id);
    res.status(200).json({
      message: "success",
      data: {
        id: job.id,
        title: job.attributes.title,
        body: job.attributes.body,
        name: job.attributes["name-requirement"],
        resume: job.attributes["resume-requirement"],
        coverLetter: job.attributes["cover-letter-requirement"],
        phone: job.attributes["phone-requirement"],
      },
    });
  } catch (err) {
    res.status(404).json({ message: err });
  }
};
