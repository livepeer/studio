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

type June = {
  identify: (payload: { email: string }) => void;
  track: (eventObject: EventObject) => void;
};

declare global {
  interface Window {
    June: June;
  }
}

const June = {
  identifyUser: (id: string, email: string): void => {
    if (typeof window === "undefined") return;

    if (window.analytics) {
      window.analytics.identify(id, {
        email,
      });
    } else {
      console.error("June is not available on window.");
    }
  },

  track: (event: string): void => {
    if (typeof window === "undefined") return;

    if (window.analytics) {
      window.analytics.track(event);
    } else {
      console.error("June is not available on window.");
    }
  },
};

export default June;
