import * as React from "react";
import NextLink from "next/link";
import * as DS from "@livepeer.com/design-system";
import { Link2Icon } from "@radix-ui/react-icons";
import { IdProvider } from "@radix-ui/react-id";
import Table from "./Table";
import KeyboardTable from "./KeyboardTable";
import Preview from "./Preview";
import DocCodeBlock from "./DocCodeBlock";
import { PackageRelease, PRLink } from "./releaseHelpers";
import HeroContainer from "./HeroContainer";
import Card from "./Card";
import Post from "./Post";

export type Frontmatter = {
  metaTitle: string;
  metaDescription?: string;
  publishedAt?: string;
  metaImage?: string;
  features?: string[];
  version?: string;
  versions?: string[];
  aria?: string;
  name?: string;
  publishedName?: string;
  slug: string;
  by?: "colm" | "stephen" | "pedro";
  readingTime?: { text: string; minutes: number; time: number; words: number };
  gzip?: number;
};

export const components = {
  ...DS,
  Tabs: (props) => (
    <DS.Tabs
      {...props}
      css={{
        mb: "$2",
        '[role="separator"]': { display: "none" },
        ...props.css,
      }}
    />
  ),
  TabsList: (props) => (
    <DS.TabsList {...props} css={{ ...props.css, mx: "$2" }} />
  ),

  h1: (props) => (
    <DS.Heading
      {...props}
      as="h1"
      size="3"
      css={{ fontWeight: 600, mb: "$6", lineHeight: "40px" }}
    />
  ),
  Description: ({ children, ...props }) => {
    // takes the text even if it's wrapped in `<p>`
    // https://github.com/wooorm/xdm/issues/47
    const childText =
      typeof children === "string" ? children : children.props.children;
    return (
      <DS.Paragraph
        size="2"
        {...props}
        as="p"
        css={{ mt: "$2", mb: "$7" }}
        children={childText}
      />
    );
  },
  h2: ({ children, id, ...props }) => (
    <LinkHeading id={id} css={{ mt: "$7", mb: "$4" }}>
      <DS.Heading
        size="2"
        {...props}
        id={id}
        as={"h2" as any}
        css={{ fontWeight: 600, scrollMarginTop: "$8" }}
        data-heading>
        {children}
      </DS.Heading>
    </LinkHeading>
  ),
  h3: ({ children, id, ...props }) => (
    <LinkHeading id={id} css={{ mt: "$7", mb: "$3" }}>
      <DS.Heading
        {...props}
        id={id}
        as={"h3" as any}
        css={{ fontWeight: 600, scrollMarginTop: "$8" }}
        data-heading>
        {children}
      </DS.Heading>
    </LinkHeading>
  ),
  h4: (props) => (
    <DS.Text
      as="h4"
      {...props}
      size="4"
      css={{ mb: "$3", lineHeight: "27px", fontWeight: 500 }}
    />
  ),
  p: (props) => <DS.Paragraph {...props} css={{ mb: "$3" }} as="p" />,
  a: ({ href = "", ...props }) => {
    if (href.startsWith("http") || href.startsWith("mailto")) {
      return (
        <DS.Link
          {...props}
          variant="violet"
          href={href}
          css={{ fontSize: "inherit" }}
          target="_blank"
          rel="noopener"
        />
      );
    }
    return (
      <NextLink href={href} passHref>
        <DS.Link {...props} css={{ color: "inherit", fontSize: "inherit" }} />
      </NextLink>
    );
  },
  hr: (props) => (
    <DS.Separator size="2" {...props} css={{ my: "$6", mx: "auto" }} />
  ),
  ul: (props) => (
    <DS.Box {...props} css={{ color: "$hiContrast", mb: "$3" }} as="ul" />
  ),
  ol: (props) => (
    <DS.Box {...props} css={{ color: "$hiContrast", mb: "$3" }} as="ol" />
  ),
  li: (props) => (
    <li>
      <DS.Paragraph {...props} />
    </li>
  ),
  strong: (props) => (
    <DS.Text
      {...props}
      css={{ display: "inline", fontSize: "inherit", fontWeight: 500 }}
    />
  ),
  img: ({ ...props }) => (
    <DS.Box css={{ my: "$6" }}>
      <DS.Box
        as="img"
        {...props}
        css={{ maxWidth: "100%", verticalAlign: "middle", ...props.css }}
      />
    </DS.Box>
  ),
  blockquote: (props) => (
    <DS.Box
      css={{
        mt: "$6",
        mb: "$5",
        pl: "$4",
        borderLeft: `1px solid $gray400`,
        color: "orange",
        "& p": {
          fontSize: "$3",
          color: "$gray11",
          lineHeight: "25px",
        },
      }}
      {...props}
    />
  ),
  pre: ({ children }) => <>{children}</>,
  inlineCode: (props) => <DS.Code {...props} />,
  code: ({
    className,
    hero,
    showLineNumbers,
    collapsed,
    scrollable,
    line,
    ...props
  }) => {
    const isInlineCode = !className;
    return isInlineCode ? (
      <DS.Code {...props} />
    ) : (
      <DocCodeBlock
        variant="violet"
        isHighlightingLines={line !== undefined}
        className={className}
        isHero={hero !== undefined}
        isCollapsible={hero !== undefined || collapsed !== undefined}
        isScrollable={scrollable !== undefined}
        showLineNumbers={showLineNumbers !== undefined}
        {...(props as any)}
      />
    );
  },
  Note: (props) => (
    <DS.Box
      as="aside"
      css={{
        mt: "$5",
        mb: "$5",
        borderRadius: "$3",
        "& p": {
          fontSize: "$3",
          color: "$slate11",
          lineHeight: "23px",
          margin: 0,
        },
      }}
      {...props}
    />
  ),
  Kbd: DS.Kbd,
  Code: DS.Code,
  Table: (props) => (
    <DS.Box css={{ mb: "$5" }}>
      <Table {...props} />
    </DS.Box>
  ),
  KeyboardTable: (props) => (
    <DS.Box css={{ mb: "$5" }}>
      <KeyboardTable {...props} />
    </DS.Box>
  ),
  Preview,
  PackageRelease,
  PRLink,
  HeroContainer,
  Post,
  Card,
};

const LinkHeading = ({
  id,
  children,
  css,
}: {
  id: string;
  children: React.ReactNode;
  css?: any;
}) => (
  <DS.Box css={{ ...css }}>
    <DS.Box
      as="a"
      href={`#${id}`}
      // data-id={id}
      css={{
        textDecoration: "none",
        color: "inherit",
        display: "inline-flex",
        alignItems: "center",

        svg: {
          opacity: 0,
        },
        "&:hover svg": {
          opacity: 1,
        },
      }}>
      {children}
      <DS.Box as="span" css={{ ml: "$2", color: "$slate10" }}>
        <Link2Icon aria-hidden />
      </DS.Box>
    </DS.Box>
  </DS.Box>
);

export const FrontmatterContext = React.createContext<Frontmatter>({} as any);

// Custom provider for next-mdx-remote
// https://github.com/hashicorp/next-mdx-remote#using-providers
export function MDXProvider(props) {
  const { frontmatter, children } = props;
  return (
    <IdProvider>
      <FrontmatterContext.Provider value={frontmatter}>
        {children}
      </FrontmatterContext.Provider>
    </IdProvider>
  );
}
