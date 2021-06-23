import { ThemeProvider } from "next-themes";
import {
  global,
  darkTheme,
  lightTheme,
  DesignSystemProvider,
  Box,
  SnackbarProvider,
} from "@livepeer.com/design-system";
import Sidebar from "@components/Dashboard/Sidebar";
import Header from "@components/Dashboard/Header";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../lib/utils";

const globalStyles = global({
  body: {
    margin: 0,
    backgroundColor: "$loContrast",
    fontFamily: "$untitled",
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },

  "body, button": {
    fontFamily: "$untitled",
  },

  svg: { display: "block" },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "::selection": {
    backgroundColor: "$violet4",
  },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },
});

type Breadcrumb = {
  title: string;
  href?: string;
};
interface Props {
  children?: JSX.Element[] | JSX.Element;
  breadcrumbs?: Breadcrumb[];
  id?: string;
}

function ContextProviders({ children }) {
  return (
    <Elements stripe={getStripe()}>
      <DesignSystemProvider>
        <ThemeProvider
          disableTransitionOnChange
          attribute="class"
          defaultTheme="dark"
          value={{ dark: darkTheme.className, light: lightTheme.className }}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </ThemeProvider>
      </DesignSystemProvider>
    </Elements>
  );
}

function DashboardLayout({ id, children, breadcrumbs }: Props) {
  globalStyles();

  return (
    <ContextProviders>
      <Sidebar id={id} />
      <Box css={{ pl: 270, width: "100%" }}>
        <Header breadcrumbs={breadcrumbs} />
        <Box
          css={{
            margin: "0 auto",
            maxWidth: "1520px",
          }}>
          {children}
        </Box>
      </Box>
    </ContextProviders>
  );
}

export default DashboardLayout;
