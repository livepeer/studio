import type { NextApiRequest, NextApiResponse } from "next";
import {
  getJobs,
  createCandidate,
  createJobApplication,
  createAnswer,
} from "lib/teamtailor";

const services = [
  {
    type: "jobs",
    method: "GET",
  },
  {
    type: "candidates",
    method: "POST",
  },
  {
    type: "job-applications",
    method: "POST",
  },
  {
    type: "answers",
    method: "POST",
  },
];

type ResponseSuccessMessage = "success";
type ResponseFallbackMessage = "This service is unsupported";

interface Job {
  id: string;
  title: string;
}

interface Candidate {
  id: string;
}

interface SuccessResponse {
  message: ResponseSuccessMessage;
  data?: Job[] | Candidate;
}

interface FallbackResponse {
  message: ResponseFallbackMessage;
}

export const config = {
  api: {
    externalResolver: true,
  },
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | FallbackResponse>
) => {
  const service = services.find(
    ({ type, method }) => type === req.query.services && method === req.method
  );

  if (service) {
    try {
      if (service.type === "jobs" && service.method === "GET") {
        const jobs = await getJobs();
        res.status(200).json({ message: "success", data: jobs });
      }
      if (service.type === "candidates" && service.method === "POST") {
        const candidate = await createCandidate(req.body);
        res.status(200).json({ message: "success", data: candidate });
      }

      if (service.type === "job-applications" && service.method === "POST") {
        await createJobApplication(req.body);
        res.status(200).json({ message: "success" });
      }

      if (service.type === "answers" && service.method === "POST") {
        await createAnswer(req.body);
        res.status(200).json({ message: "success" });
      }
    } catch (err) {
      res.status(500).json({ message: "This service is unsupported" });
    }
  } else {
    res.status(400).json({ message: "This service is unsupported" });
  }
};
