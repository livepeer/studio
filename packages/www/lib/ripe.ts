import { isExport } from "./utils";

export const categories = {
  AUTH: "Authentication",
  HOME: "Home",
  PRICING: "Pricing",
  DASHBOARD: "Dashboard",
} as const;

export const pages = {
  LANDING: "Landing Page",
  PRICING: "Pricing Page",
  CREATE_ACCOUNT: "Create Account Page",
  DASHBOARD_HOME: "Dashboard Home Page",
  STREAMS: "Streams Page",
  ASSETS: "Assets Page",
  STREAM: "Stream Page",
  ASSET: "Asset Page",
  API_KEY: "API Key Page",
} as const;

type Category = (typeof categories)[keyof typeof categories];
type PageName = (typeof pages)[keyof typeof pages];

interface EventObject {
  event: string;
  properties?: Record<string, unknown>;
}

interface UserTraits {
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
}

interface PageObject {
  category?: Category;
  name: PageName;
  properties?: Record<string, unknown>;
}

type Ripe = {
  identify: (payload: { userId: string; traits: UserTraits }) => void;
  page: (pageObject: PageObject) => void;
  track: (eventObject: EventObject) => void;
};

declare global {
  interface Window {
    Ripe: Ripe;
  }
}

const shouldRipe = () => {
  if (typeof window === "undefined") {
    return false;
  }
  if (isExport()) {
    return false;
  }
  return true;
};

const Ripe = {
  identifyUser: (userId?: string, traits?: UserTraits): void => {
    if (!shouldRipe()) {
      return;
    }

    if (window.Ripe) {
      window.Ripe.identify({
        userId,
        traits,
      });
    } else {
      console.error("Ripe is not available on window.");
    }
  },

  trackPage: (pageObject: PageObject): void => {
    if (!shouldRipe()) {
      return;
    }

    if (window.Ripe) {
      window.Ripe.page(pageObject);
    } else {
      console.error("Ripe is not available on window.");
    }
  },

  track: (eventObject: EventObject): void => {
    if (!shouldRipe()) {
      return;
    }

    if (window.Ripe) {
      window.Ripe.track(eventObject);
    } else {
      console.error("Ripe is not available on window.");
    }
  },
};

export default Ripe;
