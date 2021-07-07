// Wrapper around <MDXProvider> that injects all of our custom rendering.

import { MDXProvider } from "@mdx-js/react";
import { Styled } from "theme-ui";
import Link from "next/link";
import Code from "../components/renderers/Code";
import { Box } from "@theme-ui/components";

const StyledA = ({ href, children }) => {
  const isInternal = href.startsWith("/");
  const internalA = (
    <Box
      as="a"
      href={href}
      target={isInternal ? undefined : "_blank"}
      sx={{
        textDecoration: "none",
        cursor: "pointer",
        opacity: 1,
        transition: ".3s opacity",
        "&:hover": {
          textDecoration: "none",
          transition: ".3s opacity",
          opacity: 0.75,
        },
      }}>
      {children}
    </Box>
  );

  if (!isInternal) {
    return internalA;
  }

  return <Link href={href}>{internalA}</Link>;
};

const components = {
  code: Code,
  inlineCode: Styled.code,
  h1: Styled.h1,
  h2: Styled.h2,
  h3: Styled.h3,
  h4: Styled.h4,
  h5: Styled.h5,
  a: StyledA,
  ul: Styled.ul,
  ol: Styled.ol,
  li: Styled.li,
};

const MarkdownProvider = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);

export default MarkdownProvider;
