import App from "next/app";
import Head from "next/head";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { ApiProvider } from "hooks/use-api";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { QueryClient, QueryClientProvider } from "react-query";
import "../css/algolia-docsearch.css";

const queryClient = new QueryClient();

export default class MyApp extends App {
  render() {
    const { Component, pageProps }: any = this.props;

    return (
      <>
        <Head>
          <title>Live Video Transcoding - Livepeer.com</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>
        <QueryClientProvider client={queryClient}>
          <ApiProvider>
            <AnalyzerProvider>
              <DefaultSeo {...SEO} />
              <Component {...pageProps} />
            </AnalyzerProvider>
          </ApiProvider>
        </QueryClientProvider>
      </>
    );
  }
}
