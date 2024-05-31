import { Flex, Box } from "@livepeer/design-system";
import Router from "next/router";
import { NextSeo } from "next-seo";
import Nav from "components/Nav";
import { basePath } from "../lib/utils";

// Track client-side page views with Segment & HubSpot
if (process.env.NODE_ENV === "production") {
  Router.events.on("routeChangeComplete", (url) => {
    window.analytics.page();
    var _hsq = (window["hsq"] = window["hsq"] || []);
    _hsq.push(["setPath", url]);
    _hsq.push(["trackPageView"]);
  });
}

interface Props {
  title?: string;
  children?: JSX.Element[] | JSX.Element;
  description?: string;
  image?: any;
  url?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  preview?: boolean;
  theme?: string;
  navBackgroundColor?: string;
  css?: Record<string, any>;
  globalData?: any;
}

function Layout({
  title,
  description,
  children,
  image,
  url,
  canonical,
  noindex = process.env.NEXT_PUBLIC_SITE_URL !== "livepeer.studio",
  nofollow = process.env.NEXT_PUBLIC_SITE_URL !== "livepeer.studio",
  preview = false,
  css = {},
}: Props) {
  let seo = {
    title,
    description,
    noindex,
    nofollow,
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
      <NextSeo {...seo} />

      <Flex
        className="main"
        css={{
          backgroundImage: `url(${basePath}/noise.png)`,
          backgroundRepeat: "repeat",
          bc: "#1C1C1C",
          flexGrow: 1,
          flexDirection: "column",
          justifyContent: "flex-start",
          zIndex: 1,
          position: "relative",
          ...css,
        }}>
        {preview && (
          <Box
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 24,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: "$blue9",
              color: "white",
              lineHeight: "32px",
            }}>
            Preview Mode
          </Box>
        )}

        <Nav />

        {children}
        {/* <Footer /> */}
      </Flex>
    </>
  );
}

export default Layout;
