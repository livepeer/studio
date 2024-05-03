/**
 * It is managed meta title, url, description tags to the hard-coded pages
 * hard-coded pages: Home, Login, Pricing, Register, ResetPassword. ForgotPassword, Team, Contact
 * @TODO: We will manage these contents from within the CMS in the future
 */

import { getBrandName } from "lib/utils";

const makeCompleteTitle = (title) => `${title} - ${getBrandName()}`;
const defaultDescription =
  "Livepeer Studio is a high-performance video streaming platform that enables developers to build unique live and on-demand video experiences with up to 90% cost savings.";
const makeCompleteUrl = (suffix = "") => `https://livepeer.studio/${suffix}`;

// Main website

export const Home = {
  metaData: {
    title: getBrandName(),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const Login = {
  metaData: {
    title: makeCompleteTitle("Login"),
    description:
      "Login to your account to manage streams, get an API key, view health metrics, or manage billing.",
    url: makeCompleteUrl("login"),
  },
};

export const Pricing = {
  metaData: {
    title: makeCompleteTitle("Pricing"),
    description:
      "Start for free, then pay as you grow. Enjoy flexible pricing for projects of all sizes.",
    url: makeCompleteUrl("pricing"),
  },
};

export const Register = {
  metaData: {
    title: makeCompleteTitle("Register"),
    description:
      "Start for free, then pay as you grow. Build with affordable, reliable, decentralized video infrastructure.",
    url: makeCompleteUrl("register"),
  },
};

export const ResetPassword = {
  metaData: {
    title: makeCompleteTitle("Reset Password"),
    description: defaultDescription,
    url: makeCompleteUrl("reset-password"),
  },
};

export const ForgotPassword = {
  metaData: {
    title: makeCompleteTitle("Forgot Password"),
    description: defaultDescription,
    url: makeCompleteUrl("forgot-password"),
  },
};

export const Team = {
  metaData: {
    title: makeCompleteTitle("Team"),
    description:
      "Learn about the team behind Livepeer. We're building the world's open video infrastructure and software.",
    url: makeCompleteUrl("team"),
  },
};

export const Contact = {
  metaData: {
    title: makeCompleteTitle("Contact"),
    description:
      "Get in touch. We're eager to help you take advantage of our accessible, decentralized video infrastructure and software.",
    url: makeCompleteUrl("contact"),
  },
};

export const Blog = {
  metaData: {
    title: makeCompleteTitle("Blog"),
    description:
      "Discover the latest in video streaming technology. Learn what we're building next and about our vision for Livepeer Studio.",
    url: makeCompleteUrl("blog"),
  },
};

export const Customers = {
  metaData: {
    title: makeCompleteTitle("Customers"),
    description:
      "Livepeer Studio empowers visionary product teams shaping the future of video, supporting next-generation startups aiming for the stars, as well as established industry leaders.",
    url: makeCompleteUrl("customers"),
  },
};

export const Compare = {
  metaData: {
    title: makeCompleteTitle("Compare Livepeer Studio"),
    description:
      "Livepeer Studio is a new approach to video infrastructure. Learn how its features and pricing compare to other video infrastructure providers.",
    url: makeCompleteUrl("customers"),
  },
};

export const Jobs = {
  metaData: {
    title: makeCompleteTitle("Jobs"),
    description:
      "Join the team building Livepeer. We're fully remote and on a mission to make open video infrastructure and software accessible to everyone.",
    url: makeCompleteUrl("jobs"),
  },
};

// Dashboard related

export const Dashboard = {
  metaData: {
    title: makeCompleteTitle("Home"),
    description: defaultDescription,
    url: makeCompleteUrl("dashboard"),
  },
};

export const DashboardStreams = {
  metaData: {
    title: makeCompleteTitle("Streams"),
    description: defaultDescription,
    url: makeCompleteUrl("streams"),
  },
};

export const DashboardSessions = {
  metaData: {
    title: makeCompleteTitle("Sessions"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardStreamHealth = {
  metaData: {
    title: makeCompleteTitle("Stream Health"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardAssets = {
  metaData: {
    title: makeCompleteTitle("Assets"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardAPIKeys = {
  metaData: {
    title: makeCompleteTitle("API Keys"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardSigningKeys = {
  metaData: {
    title: makeCompleteTitle("Signing Keys"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardWebhooks = {
  metaData: {
    title: makeCompleteTitle("Webhooks"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardBilling = {
  metaData: {
    title: makeCompleteTitle("Billing"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardUsage = {
  metaData: {
    title: makeCompleteTitle("Usage"),
    description: defaultDescription,
    url: makeCompleteUrl(),
  },
};

export const DashboardPlans = {
  metaData: {
    title: makeCompleteTitle("Plans"),
    description:
      "Start for free, then pay as you grow. Enjoy flexible pricing for projects of all sizes.",
    url: makeCompleteUrl(),
  },
};

export const DashboardSettingsGeneral = {
  metaData: {
    title: makeCompleteTitle("Settings"),
    description:
      "Start for free, then pay as you grow. Enjoy flexible pricing for projects of all sizes.",
    url: makeCompleteUrl(),
  },
};
