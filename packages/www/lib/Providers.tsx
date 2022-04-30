import { ThemeProvider } from "next-themes";
import {
  themes,
  SnackbarProvider,
  DesignSystemProvider,
} from "@livepeer/design-system";

import { DEFAULT_THEME } from "./theme";

const themeMap = {};
Object.keys(themes).map(
  (key, _index) => (themeMap[themes[key].className] = themes[key].className)
);

const Providers = ({ children }) => {
  return (
    <DesignSystemProvider>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme={DEFAULT_THEME}
        value={{
          ...themeMap,
          dark: "dark-theme-violet",
          light: "light-theme-violet",
        }}
      >
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProvider>
  );
};

export default Providers;
