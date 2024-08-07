import { Box } from "@livepeer/design-system";
import { withEmailVerifyMode } from "./withEmailVerifyMode";
import Sidebar, { SidebarId } from "components/Sidebar";
import Header from "components/Header";
import FileUpload from "components/FileUpload";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe, isExport } from "../lib/utils";
import Router from "next/router";
import { useMemo } from "react";
import Head from "next/head";
import { NextSeo } from "next-seo";

// Track client-side page views with Segment & HubSpot
if (!isExport() && process.env.NODE_ENV === "production") {
  Router.events.on("routeChangeComplete", (url) => {
    window.analytics && window.analytics.page();
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
          <div className="ml-[18rem] bg-surface rounded-md h-[96vh] m-6 border border-border">
            <Header breadcrumbs={breadcrumbs} />
            <Box
              css={{
                margin: "0 auto",
              }}>
              {children}
            </Box>
          </div>
          <FileUpload />
        </Elements>
      </Box>
    </>
  );
}

export default withEmailVerifyMode(DashboardLayout);
