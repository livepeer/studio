import Document, { Html, Head, Main, NextScript } from "next/document";
import { min as snippetMin } from "@segment/snippet";
import { getCssText } from "@livepeer/design-system";
import { isExport } from "lib/utils";

const MyDocument = () => {
  const renderSnippet = () => {
    const opts = {
      apiKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY,
      // note: the page option only covers SSR tracking.
      // The Layout component is used to track other events using `window.analytics.page()`
      page: false,
    };
    return snippetMin(opts);
  };

  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap"
          rel="stylesheet"
        />
        <style
          id="stitches"
          dangerouslySetInnerHTML={{ __html: getCssText() }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @font-face {
              font-family: 'Matter';
              src: url('/fonts/Matter/Matter-Bold.eot');
              src: local('Matter Bold'), local('Matter-Bold'),
                  url('/fonts/Matter/Matter-Bold.eot?#iefix') format('embedded-opentype'),
                  url('/fonts/Matter/Matter-Bold.woff2') format('woff2'),
                  url('/fonts/Matter/Matter-Bold.woff') format('woff'),
                  url('/fonts/Matter/Matter-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
              ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-BoldItalic.eot');
                src: local('Matter Bold Italic'), local('Matter-BoldItalic'),
                    url('/fonts/Matter/Matter-BoldItalic.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-BoldItalic.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-BoldItalic.woff') format('woff'),
                    url('/fonts/Matter/Matter-BoldItalic.ttf') format('truetype');
                font-weight: bold;
                font-style: italic;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-SemiBold.eot');
                src: local('Matter SemiBold'), local('Matter-SemiBold'),
                    url('/fonts/Matter/Matter-SemiBold.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-SemiBold.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-SemiBold.woff') format('woff'),
                    url('/fonts/Matter/Matter-SemiBold.ttf') format('truetype');
                font-weight: 600;
                font-style: normal;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-MediumItalic.eot');
                src: local('Matter Medium Italic'), local('Matter-MediumItalic'),
                    url('/fonts/Matter/Matter-MediumItalic.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-MediumItalic.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-MediumItalic.woff') format('woff'),
                    url('/fonts/Matter/Matter-MediumItalic.ttf') format('truetype');
                font-weight: 500;
                font-style: italic;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-Heavy.eot');
                src: local('Matter Heavy'), local('Matter-Heavy'),
                    url('/fonts/Matter/Matter-Heavy.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-Heavy.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-Heavy.woff') format('woff'),
                    url('/fonts/Matter/Matter-Heavy.ttf') format('truetype');
                font-weight: 900;
                font-style: normal;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-LightItalic.eot');
                src: local('Matter Light Italic'), local('Matter-LightItalic'),
                    url('/fonts/Matter/Matter-LightItalic.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-LightItalic.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-LightItalic.woff') format('woff'),
                    url('/fonts/Matter/Matter-LightItalic.ttf') format('truetype');
                font-weight: 300;
                font-style: italic;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-Medium.eot');
                src: local('Matter Medium'), local('Matter-Medium'),
                    url('/fonts/Matter/Matter-Medium.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-Medium.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-Medium.woff') format('woff'),
                    url('/fonts/Matter/Matter-Medium.ttf') format('truetype');
                font-weight: 500;
                font-style: normal;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-SemiBoldItalic.eot');
                src: local('Matter SemiBold Italic'), local('Matter-SemiBoldItalic'),
                    url('/fonts/Matter/Matter-SemiBoldItalic.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-SemiBoldItalic.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-SemiBoldItalic.woff') format('woff'),
                    url('/fonts/Matter/Matter-SemiBoldItalic.ttf') format('truetype');
                font-weight: 600;
                font-style: italic;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-HeavyItalic.eot');
                src: local('Matter Heavy Italic'), local('Matter-HeavyItalic'),
                    url('/fonts/Matter/Matter-HeavyItalic.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-HeavyItalic.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-HeavyItalic.woff') format('woff'),
                    url('/fonts/Matter/Matter-HeavyItalic.ttf') format('truetype');
                font-weight: 900;
                font-style: italic;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-Light.eot');
                src: local('Matter Light'), local('Matter-Light'),
                    url('/fonts/Matter/Matter-Light.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-Light.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-Light.woff') format('woff'),
                    url('/fonts/Matter/Matter-Light.ttf') format('truetype');
                font-weight: 300;
                font-style: normal;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-Regular.eot');
                src: local('Matter Regular'), local('Matter-Regular'),
                    url('/fonts/Matter/Matter-Regular.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-Regular.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-Regular.woff') format('woff'),
                    url('/fonts/Matter/Matter-Regular.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
                ascent-override: 90%;
            }
            
            @font-face {
                font-family: 'Matter';
                src: url('/fonts/Matter/Matter-RegularItalic.eot');
                src: local('Matter Regular Italic'), local('Matter-RegularItalic'),
                    url('/fonts/Matter/Matter-RegularItalic.eot?#iefix') format('embedded-opentype'),
                    url('/fonts/Matter/Matter-RegularItalic.woff2') format('woff2'),
                    url('/fonts/Matter/Matter-RegularItalic.woff') format('woff'),
                    url('/fonts/Matter/Matter-RegularItalic.ttf') format('truetype');
                font-weight: normal;
                font-style: italic;
                ascent-override: 90%;
            }
          
            `,
          }}
        />
        {/* Inject the Segment snippet into the <head> of the document  */}
        {process.env.NODE_ENV === "production" && !isExport() && (
          <script dangerouslySetInnerHTML={{ __html: renderSnippet() }} />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
        {!isExport() && (
          <script
            type="text/javascript"
            id="hs-script-loader"
            async
            defer
            src="//js.hs-scripts.com/6160488.js"
          />
        )}
      </body>
    </Html>
  );
};

MyDocument.getInitialProps = async (ctx) => {
  const initialProps = await Document.getInitialProps(ctx);
  return { ...initialProps };
};

export default MyDocument;
