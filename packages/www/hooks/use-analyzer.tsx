import EventSource from "eventsource";
import { useApi } from "hooks";
import { useContext, useMemo, createContext, ReactNode } from "react";

import { isStaging, isDevelopment, HttpError } from "../lib/utils";

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
    | "Active"
    | "Transcoding"
    | "TranscodeRealTime"
    | "TranscodeNoErrors"
    | "Multistreaming";
  status: boolean | null;
  frequency?: Record<string, number>;
  lastProbeTime?: number;
  lastTransitionTime?: number;
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

  export interface MultistreamMetrics {
    activeSec: number;
    bytes: number;
    mediaTimeMs: number;
  }

  export interface MultistreamTargetMetrics {
    target: MultistreamTargetInfo;
    metrics?: MultistreamMetrics;
  }

  export interface StreamMetrics {
    mediaTimeMs?: number;
  }

  export interface MediaServerMetricsEvent {
    type: "media_server_metrics";
    id: string;
    timestamp: number;
    streamId: string;
    nodeId: string;
    region?: string;
    stats?: StreamMetrics;
    multistream?: MultistreamTargetMetrics[];
  }

  export interface StreamState {
    active: boolean;
  }

  export interface StreamStateEvent {
    type: "stream_state";
    id: string;
    timestamp: number;
    streamId: string;
    nodeId: string;
    region?: string;
    userId: string;
    state: StreamState;
  }

  export type Any =
    | TranscodeEvent
    | WebhookEvent
    | MediaServerMetricsEvent
    | StreamStateEvent;
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

    const sse = new EventSource(url, {
      headers: {
        authorization: `JWT ${this.authToken}`,
      },
    });
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
  // TODO: Create a separate context for auth token
  const { token: authToken } = useApi();
  const value = useMemo(() => new AnalyzerClient(authToken), [authToken]);
  return <AnalyzerContext.Provider value={value} children={children} />;
};

export default function useAnalyzer() {
  return useContext(AnalyzerContext);
}
