import { Link as A } from "@theme-ui/components";
import NextLink from "next/link";

export type LinkProps = {
  children: React.ReactNode;
  href: string;
  variant?: string;
  isExternal?: boolean;
  asPath?: string;
} & React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

const Link = ({ isExternal, children, ...moreProps }: LinkProps) => {
  if (isExternal) {
    return (
      <A target="_blank" rel="noopener" {...moreProps}>
        {children}
      </A>
    );
  }
  const { asPath, href, ...anchorProps } = moreProps;
  return (
    <NextLink as={asPath} href={href} passHref>
      <A {...anchorProps}>{children}</A>
    </NextLink>
  );
};

export default Link;
