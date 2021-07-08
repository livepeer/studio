import { useTheme } from "next-themes";
import { styled } from "@livepeer.com/design-system";
import * as Switch from "@radix-ui/react-switch";
import Sun from "../../../public/img/icons/sun.svg";
import Moon from "../../../public/img/icons/moon.svg";
import { useEffect, useState } from "react";

const StyledSwitch = styled(Switch.Root, {
  appearance: "none",
  border: "none",
  padding: 0,
  width: 25,
  height: 12,
  backgroundColor: "$colors$mauve6",
  borderRadius: 25,
  position: "relative",
  display: "flex",
  alignItems: "center",
  "&:focus": {
    outline: "none",
    boxShadow: "0 0 0 2px $colors$violet9",
  },
  '&[data-state="checked"]': {
    linearGradient: "to right, $colors$violet8, $colors$violet5",
  },
});

const StyledThumb = styled(Switch.Thumb, {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  backgroundColor: "$loContrast",
  borderRadius: "$round",
  boxShadow: "rgba(0, 0, 0, 0.3) 0px 0px 2px",
  transform: "translateX(-7px)",
  willChange: "transform",
  "> :nth-child(2)": {
    display: "none",
  },
  '&[data-state="checked"]': {
    backgroundColor: "$colors$mauve6",
    transform: "translateX(12px)",
    "> :nth-child(1)": {
      display: "none",
    },
    "> :nth-child(2)": {
      display: "block",
      fill: "$hiContrast",
    },
  },
});

const ThemeSwitch = () => {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (resolvedTheme === "dark") {
      setChecked(true);
    } else {
      setChecked(false);
    }
  }, [resolvedTheme]);

  const handleChange = () => {
    resolvedTheme === "dark" ? setTheme("light") : setTheme("dark");
    setChecked(resolvedTheme === "dark" ? true : false);
  };

  return (
    <StyledSwitch checked={checked} onCheckedChange={handleChange}>
      <StyledThumb>
        <Sun />
        <Moon />
      </StyledThumb>
    </StyledSwitch>
  );
};

export default ThemeSwitch;
