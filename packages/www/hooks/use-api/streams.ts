import { Error as ApiError } from "@livepeer.studio/api";
import { StreamInfo } from "./types";
import { ApiContextInterface } from ".";

const makeStreamApiFunctions = (context: ApiContextInterface) => ({
  async getStreamInfo(id: string): Promise<[Response, StreamInfo | ApiError]> {
    let [res, info] = await context.fetch(`/stream/${id}/info`);
    return [res, info as StreamInfo | ApiError];
  },
});

export default makeStreamApiFunctions;
