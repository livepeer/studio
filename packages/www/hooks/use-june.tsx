import { useEffect, useState } from "react";
import { AnalyticsBrowser } from "@june-so/analytics-next";

export const events: EventObject = {
  all: {
    documentation: "documentation",
    feedback: "feedback",
  },
  onboarding: {
    register: "register",
  },
  stream: {
    preview: "stream preview",
    embed: "stream embed",
    health: "stream health check",
    goLive: "stream golive",
    keyCopy: "stream key copy",
    multistreamTarget: "stream multistream target add",
    recordingToggle: "stream recording toggle",
  },
  vod: {
    // NOT TRACKING VOD USAGE YET, WILL ADD IN FUTURE RELEASE
  },
  developer: {
    webhookDetail: "developer webhook detail",
    apiKeyCreate: "developer api key create",
  },
  landing: {
    billingCta: "landing billing cta",
  },
  billing: {
    usageDetails: "billing usage details cta",
  },
} as const;

interface EventObject {
  [path: string]: EventDetail;
}

interface EventDetail {
  [path: string]: string;
}

export function useJune() {
  const [analytics, setAnalytics] = useState(undefined);

  useEffect(() => {
    const loadAnalytics = async () => {
      let response = AnalyticsBrowser.load({
        writeKey: "3VINzqYVjfOxFyIr",
      });
      setAnalytics(response);
    };
    loadAnalytics();
  }, []);

  return analytics;
}
