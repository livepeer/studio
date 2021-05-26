import { Button } from "../";
import { darkTheme } from "../stitches.config";
import { useTheme } from "next-themes";

export function DarkThemeButton() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  console.log("resolvedTheme", resolvedTheme);
  return (
    <Button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      Toggle theme
    </Button>
  );
}
