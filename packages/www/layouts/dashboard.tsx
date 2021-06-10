import { ThemeProvider } from "next-themes";
import {
  global,
  darkTheme,
  lightTheme,
  DesignSystemProvider,
  Box,
} from "@livepeer.com/design-system";
import Sidebar from "@components/Dashboard/Sidebar";
import Header from "@components/Dashboard/Header";

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

function DashboardLayout({ id, children, breadcrumbs }: Props) {
  globalStyles();

  return (
    <DesignSystemProvider>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme="dark"
        value={{ dark: darkTheme.className, light: lightTheme.className }}>
        <Sidebar id={id} />
        <Box css={{ pl: 270, width: "100%" }}>
          <Header breadcrumbs={breadcrumbs} />
          {children}
        </Box>
      </ThemeProvider>
    </DesignSystemProvider>
  );
}

export default DashboardLayout;
