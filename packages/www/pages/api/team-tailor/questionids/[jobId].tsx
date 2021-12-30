import type { NextApiRequest, NextApiResponse } from "next";
import { getQuestionIdsByJobId } from "lib/teamtailor";

type ResponseSuccessMessage = "success";

interface QuestionId {
  id: string;
  type: string;
}

interface SuccessResponse {
  message: ResponseSuccessMessage;
  data: QuestionId[];
}

interface FallbackResponse {
  message: string;
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
  console.log(req.query.jobId);
  try {
    const response = await getQuestionIdsByJobId(req.query.jobId);
    res.status(200).json({
      message: "success",
      data: response,
    });
  } catch (err) {
    res.status(404).json({ message: "this service is unsupported" });
  }
};
