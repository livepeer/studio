import { Box } from "@livepeer/design-system";
import { withEmailVerifyMode } from "./withEmailVerifyMode";
import Sidebar, { SidebarId } from "components/Sidebar";
import Header from "components/Header";
import FileUpload from "components/FileUpload";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe, isExport, isProduction } from "../lib/utils";
import ReactGA from "react-ga";
import Router from "next/router";
import { useEffect, useMemo } from "react";
import { hotjar } from "react-hotjar";
import Head from "next/head";
import { NextSeo } from "next-seo";

if (!isExport()) {
  if (process.env.NODE_ENV === "production") {
    ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
  } else {
    ReactGA.initialize("test", { testMode: true });
  }
}

// Track client-side page views with Segment & HubSpot
if (!isExport() && process.env.NODE_ENV === "production") {
  Router.events.on("routeChangeComplete", (url) => {
    window.analytics.page();
    var _hsq = (window["hsq"] = window["hsq"] || []);
    _hsq.push(["setPath", url]);
    _hsq.push(["trackPageView"]);
  });
}

export type Breadcrumb = {
  title: string;
  href?: string;
};
export interface Props {
  children?: JSX.Element[] | JSX.Element;
  breadcrumbs?: Breadcrumb[];
  id?: SidebarId;
  requireLoggedIn?: boolean;
  title?: string;
  description?: string;
  noindex?: boolean;
  nofollow?: boolean;
  image?: any;
  url?: string;
  canonical?: string;
}

function DashboardLayout({
  id,
  children,
  breadcrumbs,
  title,
  description,
  noindex = true,
  nofollow = true,
  image,
  url,
  canonical,
  requireLoggedIn = true,
}: Props) {
  const stripePromise = useMemo(() => getStripe(), []);

  useEffect(() => {
    if (isProduction()) {
      ReactGA.pageview(window.location.pathname + window.location.search);
      hotjar.initialize(2525106, 6);
    }
  }, []);

  let seo = {
    title,
    description,
    noindex,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image ? image.url : "https://assets.livepeer.studio/api/og",
          alt: image ? image.alt : "Livepeer Studio",
          width: 1200,
          height: 642,
        },
      ],
    },
  };

  if (canonical) {
    seo["canonical"] = canonical;
  }

  return (
    <>
      <Box className="dashboard">
        <Elements stripe={stripePromise}>
          <Head>
            <meta name="viewport" content="width=1023" />
          </Head>
          {!isExport() && <NextSeo {...seo} />}
          <Sidebar id={id} />
          <Box css={{ pl: 270, width: "100%" }}>
            <Header breadcrumbs={breadcrumbs} />
            <Box
              css={{
                margin: "0 auto",
                maxWidth: "1520px",
              }}>
              {children}
            </Box>
          </Box>
          <FileUpload />
        </Elements>
      </Box>
    </>
  );
}

export default withEmailVerifyMode(DashboardLayout);
