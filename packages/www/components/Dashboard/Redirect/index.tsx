import { TOKEN_KEY } from "hooks/use-api/tokenStorage";
import Head from "next/head";

export const DashboardRedirect = () => {
  return (
    <Head>
      <script
        dangerouslySetInnerHTML={{
          __html: `
  if (!window.localStorage || !window.localStorage.getItem('${TOKEN_KEY}')) {
      location.replace('/login?next=' + encodeURIComponent(
        location.pathname + location.search
      ))
  }
  `,
        }}
      />
    </Head>
  );
};
