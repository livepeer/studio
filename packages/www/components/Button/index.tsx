import { Button } from "@theme-ui/components";
import Ink from "react-ink";
import Link from "next/link";
import { SxStyleProp } from "theme-ui";

type Base = {
  children: React.ReactNode;
  ink?: boolean;
  sx?: SxStyleProp;
};

type AsLink = Base & {
  isLink: true;
  href: string;
  isExternal?: boolean;
  asPath?: string;
};

type AsButton = Base & {
  isLink?: false;
};

export type ButtonProps = AsLink | AsButton;

const baseSx: SxStyleProp = {
  position: "relative"
};

export default ({ children, sx, ink = false, ...props }: ButtonProps) => {
  if (props.isLink) {
    if (props.isExternal) {
      return (
        <Button href={props.href} as="a" sx={{ ...baseSx, ...sx }}>
          {ink && <Ink />}
          {children}
        </Button>
      );
    }
    return (
      <Link href={props.href} as={props.asPath} passHref>
        <Button as="a" sx={{ ...baseSx, ...sx }}>
          {ink && <Ink />}
          {children}
        </Button>
      </Link>
    );
  }
  return (
    <Button {...props} sx={{ ...baseSx, ...sx }}>
      {ink && <Ink />}
      {children}
    </Button>
  );
};
