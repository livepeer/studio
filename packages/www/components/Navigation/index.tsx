import React from "react";
import NavigationBase from "./base";

type NavProps = React.ComponentProps<typeof NavigationBase>;

const defaultNavProps: NavProps = {
  links: [
    {
      href: "/docs",
      children: "Docs"
    },
    {
      href: "/blog",
      children: "Blog"
    },
    {
      href: "/contact",
      children: "Contact us"
    }
  ]
};

const docsNavProps: NavProps = {
  links: [
    {
      href: "/docs",
      children: "Overview"
    },
    {
      href: "/guides",
      children: "Guides"
    },
    {
      href: "/reference",
      children: "API Reference"
    }
  ],
  breadcrumb: [{ children: "Docs", href: "/docs" }]
};

const DefaultNav = () => <NavigationBase {...defaultNavProps} />;
const DocsNav = () => <NavigationBase {...docsNavProps} />;

export { DefaultNav, DocsNav };
