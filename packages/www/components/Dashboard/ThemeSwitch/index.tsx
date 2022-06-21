import { useTheme } from "next-themes";
import { styled } from "@livepeer/design-system";
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
  bc: "$neutral6",
  borderRadius: 25,
  position: "relative",
  display: "flex",
  alignItems: "center",
  "&:focus": {
    outline: "none",
    boxShadow: "0 0 0 2px $blue9",
  },
  '&[data-state="checked"]': {
    background: "linear-gradient(to right, $blue8, $blue5)",
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
    bc: "$neutral6",
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
  const { resolvedTheme, setTheme } = useTheme();
  const [checked, setChecked] = useState(false);

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
    <StyledSwitch checked={checked} onCheckedChange={handleChange}>
      <StyledThumb>
        <Sun />
        <Moon />
      </StyledThumb>
    </StyledSwitch>
  );
};

export default ThemeSwitch;
