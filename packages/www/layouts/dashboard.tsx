import { ThemeProvider } from "next-themes";
import {
  global,
  darkTheme,
  DesignSystemProvider,
  Box,
} from "@livepeer.com/design-system";
import Sidebar from "@components/Dashboard/Sidebar";
import Header from "@components/Dashboard/Header";
import { IdProvider } from "@radix-ui/react-id";

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
    backgroundColor: "$violet300",
  },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },
});

interface Props {
  children?: JSX.Element[] | JSX.Element;
}

function DashboardLayout({ children }: Props) {
  globalStyles();

  return (
    <IdProvider>
      <DesignSystemProvider>
        <ThemeProvider
          disableTransitionOnChange
          attribute="class"
          value={{ light: "light-theme", dark: darkTheme.className }}
          defaultTheme="system">
          <Sidebar />
          <Box css={{ pl: 270, width: "100%" }}>
            <Header />
            {children}
          </Box>
        </ThemeProvider>
      </DesignSystemProvider>
    </IdProvider>
  );
}

export default DashboardLayout;
