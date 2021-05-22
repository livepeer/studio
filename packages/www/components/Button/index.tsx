/** @jsx jsx */
import { jsx } from "theme-ui";
import { Button as ThemeUIButton } from "@theme-ui/components";
import Ink from "react-ink";
import Link from "next/link";
import { SxStyleProp } from "theme-ui";

type Base = {
  children: React.ReactNode;
  variant?: string;
  ink?: boolean;
  sx?: SxStyleProp;
};

type AsLink = Base & {
  isLink: true;
  href: string;
  isExternal?: boolean;
  asPath?: string;
} & React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >;

type AsButton = Base & {
  isLink?: false;
} & React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >;

export type ButtonProps = AsLink | AsButton;

const baseSx: SxStyleProp = {
  position: "relative",
};

const Button = ({ children, sx, ink = false, ...props }: ButtonProps) => {
  if (props.isLink) {
    if (props.isExternal) {
      return (
        <ThemeUIButton
          {...props}
          isLink={undefined}
          isExternal={undefined}
          as="a"
          sx={{ ...baseSx, ...sx }}>
          {ink && <Ink />}
          {children}
        </ThemeUIButton>
      );
    }
    return (
      <Link href={props.href} as={props.asPath} passHref>
        <ThemeUIButton
          {...props}
          isLink={undefined}
          isExternal={undefined}
          href={undefined}
          asPath={undefined}
          as="a"
          sx={{ ...baseSx, ...sx }}>
          {ink && <Ink />}
          {children}
        </ThemeUIButton>
      </Link>
    );
  }
  return (
    <ThemeUIButton {...props} sx={{ ...baseSx, ...sx }}>
      {ink && <Ink />}
      {children}
    </ThemeUIButton>
  );
};

export default Button;
