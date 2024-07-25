import { DEFAULT_THEME } from "../lib/theme";

import { TooltipProvider } from "components/ui/tooltip";
import { DesignSystemProvider } from "context/DesignSystemContext";
import { LivepeerConfigProvider } from "context/LivepeerConfig";
import { ProjectProvider } from "context/ProjectContext";
import ReactQueryProvider from "context/QueryContext";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { ApiProvider } from "hooks/use-api";
import { fontSans } from "lib/fonts";
import { cn } from "lib/utils";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "../css/tailwind.css";
import "../css/hubspot.scss";
import "../css/markdown.css";
import "../css/recaptcha.css";
import "../css/tailwind.css";
import { SyncProjectId } from "./sync-project-id";
// import { getThemes } from "@livepeer/design-system";

export const metadata: Metadata = {
  title: "Livepeer Studio",
  description:
    "Livepeer Studio is a high-performance video streaming platform that enables developers to build unique live and on-demand video experiences with up to 90% cost savings.",
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://livepeer.studio",
    title: "Livepeer Studio",
    description:
      "Livepeer Studio is a high-performance video streaming platform that enables developers to build unique live and on-demand video experiences with up to 90% cost savings.",
    images: [
      {
        url: "https://assets.livepeer.studio/api/og",
        width: 1200,
        height: 642,
        alt: "Livepeer Studio",
      },
    ],
    siteName: "Livepeer Studio",
  },
  twitter: {
    creator: "@livepeerstudio",
    site: "@site",
    card: "summary_large_image",
  },
};

// const themes: any = getThemes();
// const themeMap = {};
// Object.keys(themes).map(
//   (key, _index) => (themeMap[themes[key].className] = themes[key].className),
// );

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "h-screen overflow-hidden bg-background font-sans antialiased text-foreground",
          fontSans.variable,
        )}>
        <DesignSystemProvider>
          <ThemeProvider
            disableTransitionOnChange
            attribute="class"
            defaultTheme={DEFAULT_THEME}>
            <ProjectProvider>
              <SyncProjectId />
              {/* <SnackbarProvider> */}
              <ReactQueryProvider>
                <ApiProvider>
                  <AnalyzerProvider>
                    <TooltipProvider>
                      <LivepeerConfigProvider>
                        {children}
                      </LivepeerConfigProvider>
                    </TooltipProvider>
                  </AnalyzerProvider>
                </ApiProvider>
              </ReactQueryProvider>

              {/* </SnackbarProvider> */}
            </ProjectProvider>
          </ThemeProvider>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
