import type { NextApiRequest, NextApiResponse } from "next";
import { getQuestionsById } from "lib/teamtailor";

type ResponseSuccessMessage = "success";
type ResponseFallbackMessage = "this service is unsupported";

interface Question {
  id: string;
  type: string;
  questionType: string;
  title: string;
}

interface SuccessResponse {
  message: ResponseSuccessMessage;
  data: Question;
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
    const response = await getQuestionsById(req.query.id);

    res.status(200).json({
      message: "success",
      data: {
        id: response.id,
        type: response.type,
        title: response.attributes.title,
        questionType: response.attributes["question-type"],
      },
    });
  } catch (err) {
    res.status(404).json({ message: "this service is unsupported" });
  }
};
