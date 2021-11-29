import Document, { Html, Head, Main, NextScript } from "next/document";
import * as snippet from "@segment/snippet";
import { getCssString } from "@livepeer.com/design-system";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  renderSnippet() {
    const opts = {
      apiKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY,
      // note: the page option only covers SSR tracking.
      // The Layout component is used to track other events using `window.analytics.page()`
      page: false,
    };

    return snippet.min(opts);
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <title>Live Video Transcoding - Livepeer.com</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
          <style
            id="stitches"
            dangerouslySetInnerHTML={{ __html: getCssString() }}
          />
          {/* Inject the Segment snippet into the <head> of the document  */}
          {process.env.NODE_ENV === "production" && (
            <script
              dangerouslySetInnerHTML={{ __html: this.renderSnippet() }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
          {
            <script
              type="text/javascript"
              id="hs-script-loader"
              async
              defer
              src="//js.hs-scripts.com/6160488.js"
            />
          }
        </body>
      </Html>
    );
  }
}

export default MyDocument;
