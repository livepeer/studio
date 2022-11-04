/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import { Button as ThemeUIButton } from "@theme-ui/components";
import Ink from "react-ink";
import { SxStyleProp } from "theme-ui";

type ButtonProps = {
  children: React.ReactNode;
  sx?: SxStyleProp;
  variant?: string;
  ink?: boolean;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

const baseSx: SxStyleProp = {
  position: "relative",
};

const Button = ({
  children,
  sx,
  variant,
  ink = false,
  ...props
}: ButtonProps) => (
  <ThemeUIButton {...props} sx={{ ...baseSx, ...sx }}>
    {ink && <Ink />}
    {children}
  </ThemeUIButton>
);

export default Button;
