import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "../ui/switch";
import { MoonIcon, SunIcon } from "lucide-react";

const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [checked, setChecked] = useState(resolvedTheme?.includes("dark"));

  useEffect(() => {
    if (resolvedTheme?.includes("dark")) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [resolvedTheme]);

  const handleChange = () => {
    resolvedTheme?.includes("dark") ? setTheme("light") : setTheme("dark");
    setChecked(resolvedTheme?.includes("dark") ? true : false);
  };

  return (
    <Switch
      className="h-5 w-10"
      thumbClassName="h-4 w-4"
      checked={checked}
      onCheckedChange={handleChange}
      thumb={
        checked ? (
          <MoonIcon className="fill-primary h-2 w-2" />
        ) : (
          <SunIcon className="h-2 w-2" />
        )
      }
    />
  );
};

export default ThemeSwitch;
