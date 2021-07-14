import React, { useMemo, useState, useCallback, useEffect } from "react";
import NavigationBase from "./base";
import { useRouter } from "next/router";
import DocsMobileSubMenu from "./mobile/docs-submenu";
import { Tree } from "components/TableOfContents";
import { isMobile } from "react-device-detect";

type NavProps = React.ComponentProps<typeof NavigationBase>;

const defaultNavProps: NavProps = {
  links: [
    {
      href: "/docs/guides",
      children: "Docs",
    },
    {
      href: "/blog",
      children: "Blog",
    },
    {
      href: "/pricing",
      children: "Pricing",
    },
    {
      href: "/contact",
      children: "Contact",
    },
  ],
};

const DefaultNav = () => <NavigationBase {...defaultNavProps} />;

type DocsNavProps = {
  tree?: Tree[];
  ignoreList?: string[];
};

const DocsNav = ({ tree, ignoreList }: DocsNavProps) => {
  const router = useRouter();
  const { pathname } = router;
  const [mobileSubmenuVisible, setMobileSubmenuVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState<number>();

  const handleScroll = useCallback(() => {
    const { scrollTop: currentScrollTop } = document.documentElement;
    setLastScrollTop(currentScrollTop);
    if (currentScrollTop > lastScrollTop) {
      setMobileSubmenuVisible(false);
    } else if (currentScrollTop < lastScrollTop) {
      setMobileSubmenuVisible(true);
    }
  }, [lastScrollTop]);

  useEffect(() => {
    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const docsNavProps: NavProps = useMemo(
    () => ({
      links: [
        {
          href: "/docs/guides",
          children: "Overview",
        },
        {
          href: "/docs/guides",
          children: "Guides",
        },
        {
          href: "/docs/api-reference",
          children: "API Reference",
        },
      ],
      breadcrumb: [
        {
          children: "Docs",
          href: "/docs/guides",
          mobileDropdownLinks: [
            {
              children: "Overview",
              href: "/docs/guides",
              isSelected: pathname === "/docs",
            },
            {
              children: "Guides",
              href: "/docs/vide-guides",
              isSelected: pathname === "/docs/guides",
            },
            {
              children: "API Reference",
              href: "/docs/api-reference",
              isSelected: pathname === "/docs/api-reference",
            },
          ],
        },
      ],
    }),
    [pathname]
  );

  return (
    <>
      <NavigationBase
        {...docsNavProps}
        withShadow={!mobileSubmenuVisible || !tree || !isMobile}
        css={tree ? { backgroundColor: "$panel" } : undefined}
      />
      {tree && (
        <DocsMobileSubMenu
          tree={tree}
          ignoreList={ignoreList}
          mobileSubmenuVisible={true}
        />
      )}
    </>
  );
};

export { DefaultNav, DocsNav };
