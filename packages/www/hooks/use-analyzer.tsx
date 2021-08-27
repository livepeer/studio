import { useContext, createContext, ReactNode } from "react";

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
  type?: string;
  status: boolean | null;
  frequency?: Record<string, number>;
  lastProbeTime?: string;
  lastTransitionsTime?: string;
}

export interface HealthStatus {
  id: string;
  healthy?: Condition;
  conditions: Condition[];
  multistream?: MultistreamStatus[];
}

const makeUrl = (region: string, path: string) => {
  if (isDevelopment() && useLocalAnalyzer) {
    return `http://localhost:8080/data${path}`;
  }
  const tld = isStaging() ? "monster" : "com";
  return `https://${region}.livepeer.${tld}/data${path}`;
};

class AnalyzerClient {
  constructor(private region: string) {}

  fetchJson = async <T,>(path: string, opts: RequestInit = {}) => {
    const url = makeUrl(this.region, path);
    const headers = new Headers(opts.headers || {});
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

  getHealth = async (streamId: string) => {
    const path = `/stream/${streamId}/health`;
    const { res, body } = await this.fetchJson<HealthStatus>(path);
    if (res.status !== 200 && res.status !== 404) {
      throw new HttpError(res.status, body);
    }
    return res.status === 200 ? body : null;
  };
}

export const AnalyzerContext = createContext(new AnalyzerClient(defaultRegion));

export const AnalyzerProvider = ({
  children,
  region = defaultRegion,
}: {
  children: ReactNode;
  region: string;
}) => {
  const value = new AnalyzerClient(region);
  return <AnalyzerContext.Provider value={value} children={children} />;
};

export default function useAnalyzer() {
  return useContext(AnalyzerContext);
}
