import App from "next/app";
import Head from "next/head";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { ApiProvider } from "hooks/use-api";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { QueryClient, QueryClientProvider } from "react-query";
import { MetaMaskProvider } from "metamask-react";
import "../css/algolia-docsearch.css";
import "../css/recaptcha.css";
import React from "react";
import { globalCss } from "@livepeer/design-system";

const queryClient = new QueryClient();

const globalStyles = globalCss({
  body: {
    margin: 0,
    backgroundColor: "$loContrast",
    fontFamily: "$untitled",
    color: "$hiContrast",
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },

  "body, button": {
    fontFamily: "$untitled",
  },

  svg: { display: "block" },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },

  "#hubspot-messages-iframe-container iframe": {
    colorScheme: "auto",
  },
});

export default class MyApp extends App {
  render() {
    const { Component, pageProps }: any = this.props;
    globalStyles();
    return (
      <>
        <QueryClientProvider client={queryClient}>
          <MetaMaskProvider>
            <ApiProvider>
              <AnalyzerProvider>
                <DefaultSeo {...SEO} />
                <Component {...pageProps} />
              </AnalyzerProvider>
            </ApiProvider>
          </MetaMaskProvider>
        </QueryClientProvider>
      </>
    );
  }
}
