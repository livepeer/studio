import React, { useMemo } from "react";
import NavigationBase from "./base";
import { useRouter } from "next/router";

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

const DefaultNav = () => <NavigationBase {...defaultNavProps} />;
const DocsNav = () => {
  const router = useRouter();
  const { pathname } = router;

  const docsNavProps: NavProps = useMemo(
    () => ({
      links: [
        {
          href: "/docs",
          children: "Overview"
        },
        {
          href: "/docs/guides",
          children: "Guides"
        },
        {
          href: "/docs/reference",
          children: "API Reference"
        }
      ],
      breadcrumb: [
        {
          children: "Docs",
          href: "/docs",
          mobileDropdownLinks: [
            {
              children: "Overview",
              href: "/docs",
              isSelected: pathname === "/docs"
            },
            {
              children: "Guides",
              href: "/docs/guides",
              isSelected: pathname === "/docs/guides"
            },
            {
              children: "API Reference",
              href: "/docs/reference",
              isSelected: pathname === "/docs/reference"
            }
          ]
        }
      ]
    }),
    [pathname]
  );

  return <NavigationBase {...docsNavProps} />;
};

export { DefaultNav, DocsNav };
