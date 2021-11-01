import { useContext, useMemo, createContext, ReactNode } from "react";

import { isStaging, isDevelopment, HttpError } from "../lib/utils";
import { getStoredToken } from "./use-api";

const useLocalAnalyzer = false;
const defaultRegion = "nyc";

export interface MultistreamStatus {
  target: {
    id: string;
    name: string;
    profile: string;
  };
  connected?: Condition;
}

export interface Condition {
  type?:
    | "Transcoding"
    | "TranscodeRealTime"
    | "TranscodeNoErrors"
    | "Multistreaming";
  status: boolean | null;
  frequency?: Record<string, number>;
  lastProbeTime?: string;
  lastTransitionsTime?: string;
}

export interface HealthStatus {
  id: string;
  healthy: Condition;
  conditions: Condition[];
  multistream?: MultistreamStatus[];
}

export namespace events {
  export interface SegmentMetadata {
    name: string;
    seqNo: number;
    duration: number;
    byteSize: number;
  }

  export interface TranscodeAttemptInfo {
    orchestrator: OrchestratorMetadata;
    latencyMs: number;
    error?: string;
  }

  export interface OrchestratorMetadata {
    address: string;
    transcodeUri: string;
  }

  export interface TranscodeEvent {
    type: "transcode";
    id: string;
    timestamp: number;
    streamId: string;
    nodeId: string;
    segment: SegmentMetadata;
    startTime: number;
    latencyMs: number;
    success: boolean;
    attempts: TranscodeAttemptInfo[];
  }

  export interface MultistreamTargetInfo {
    id: string;
    name: string;
    profile: string;
  }

  export interface MultistreamWebhookPayload {
    target: MultistreamTargetInfo;
  }

  export interface WebhookEvent {
    type: "webhook_event";
    id: string;
    timestamp: number;
    streamId: string;
    event:
      | "multistream.connected"
      | "multistream.disconnected"
      | "multistream.error";
    userId: string;
    sessionId?: string;
    payload?: object;
  }

  export type Any = TranscodeEvent | WebhookEvent;
}

const makeUrl = (region: string, path: string) => {
  if (isDevelopment() && useLocalAnalyzer) {
    return `http://localhost:8080/data${path}`;
  }
  const tld = isStaging() || isDevelopment() ? "monster" : "com";
  return `https://${region || defaultRegion}.livepeer.${tld}/data${path}`;
};

class AnalyzerClient {
  constructor(private authToken: string) {}

  fetchJson = async <T,>(
    region: string,
    path: string,
    opts: RequestInit = {}
  ) => {
    const url = makeUrl(region, path);
    const headers = new Headers(opts.headers || {});
    if (this.authToken && !headers.has("authorization")) {
      headers.set("authorization", `JWT ${this.authToken}`);
    }
    const res = await fetch(url, {
      ...opts,
      headers,
    });

    let body: T;
    if (res.status !== 204) {
      body = await res.json();
    }
    return { res, body };
  };

  getHealth = async (region: string, streamId: string) => {
    const path = `/stream/${streamId}/health`;
    const { res, body } = await this.fetchJson<HealthStatus>(region, path);
    if (res.status !== 200 && res.status !== 404) {
      throw new HttpError(res.status, body);
    }
    return res.status === 200 ? body : null;
  };

  getEvents = (
    region: string,
    streamId: string,
    handler: (data: events.Any) => void,
    from?: number
  ) => {
    const path = `/stream/${streamId}/events`;
    const qs = !from ? "" : "?from=" + from;
    const url = makeUrl(region, path + qs);

    const sse = new EventSource(url, {});
    sse.addEventListener("lp_event", (e: MessageEvent) => {
      handler(JSON.parse(e.data));
    });
    sse.addEventListener("error", (e) => {
      console.error("sse error:", e);
      sse.close();
    });
    return () => sse.close();
  };
}

export const AnalyzerContext = createContext(new AnalyzerClient(null));

export const AnalyzerProvider = ({ children }: { children: ReactNode }) => {
  const authToken = getStoredToken();
  const value = useMemo(() => new AnalyzerClient(authToken), [authToken]);
  return <AnalyzerContext.Provider value={value} children={children} />;
};

export default function useAnalyzer() {
  return useContext(AnalyzerContext);
}
