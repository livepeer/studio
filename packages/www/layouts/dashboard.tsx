import { Elements } from "@stripe/react-stripe-js";
import FileUpload from "components/FileUpload";
import Header from "components/Header";
import Sidebar, { SidebarId } from "components/Sidebar";
import { Flex } from "components/ui/flex";
import { NextSeo } from "next-seo";
import Router from "next/router";
import { useMemo } from "react";
import { getStripe, isExport } from "../lib/utils";
import { withEmailVerifyMode } from "./withEmailVerifyMode";

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
      <div className="flex min-w-0 min-h-0 flex-1 w-full h-full max-h-full">
        <Elements stripe={stripePromise}>
          {!isExport() && <NextSeo {...seo} />}
          <Sidebar id={id} />
          <div
            style={{
              margin: 25,
            }}
            className="border border-input  flex w-full min-w-0 flex-col max-h-auto h-auto bg-card rounded-md min-h-0 overflow-auto">
            <Header breadcrumbs={breadcrumbs} />
            <div className="w-full flex flex-col mx-auto max-w-[1200px] h-full">
              {children}
            </div>
          </div>
          <FileUpload />
        </Elements>
      </div>
    </>
  );
}

export default withEmailVerifyMode(DashboardLayout);
