import { Box } from "@livepeer/design-system";
import { withEmailVerifyMode } from "./withEmailVerifyMode";
import Sidebar, { SidebarId } from "@components/Dashboard/Sidebar";
import Header from "@components/Dashboard/Header";
import FileUpload from "@components/Dashboard/FileUpload";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../lib/utils";
import ReactGA from "react-ga";
import Router from "next/router";
import { useEffect } from "react";
import { hotjar } from "react-hotjar";
import Head from "next/head";
import { NextSeo } from "next-seo";
import { DashboardRedirect } from "@components/Dashboard/Redirect";

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
} else {
  ReactGA.initialize("test", { testMode: true });
}

// Track client-side page views with Segment & HubSpot
if (process.env.NODE_ENV === "production") {
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
  image,
  url,
  canonical,
  requireLoggedIn = true,
}: Props) {
  useEffect(() => {
    if (window.location.hostname === "livepeer.studio") {
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
          url: image ? image.url : "https://livepeer.studio/img/OG.png",
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
      {requireLoggedIn && <DashboardRedirect />}
      <Box className="dashboard">
        <Elements stripe={getStripe()}>
          <Head>
            <meta name="viewport" content="width=1023" />
          </Head>
          <NextSeo {...seo} />
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
