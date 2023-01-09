import { TOKEN_KEY } from "hooks/use-api/tokenStorage";
import Script from "next/script";

export const DashboardRedirect = () => {
  return (
    <Script
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
  );
};
